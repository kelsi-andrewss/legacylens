import { NextRequest, after } from "next/server";
import { embedQuery, getOpenAI, generateHypotheticalDocument } from "@/lib/openai";
import { queryPinecone, fetchRoutinesByNames, upsertSyntheticChunk } from "@/lib/pinecone";
import { QueryMode, Lens, getSystemPrompt, buildUserMessage } from "@/lib/prompts";
import { CHAT_MODEL, TEMPERATURE, MAX_TOKENS, DEFAULT_TOP_K, GRAPH_EXPANSION_MAX_CHUNKS, MIN_SCORE_THRESHOLD } from "@/lib/config";
import { validateQuery, validateMode, sanitizeString } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, mode = "explain", filters, theme, lens, history = [] } = body as {
      query: string;
      mode?: QueryMode;
      filters?: { category?: string; data_type_prefix?: string };
      theme?: string;
      lens?: Lens;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    const queryResult = validateQuery(query);
    if (!queryResult.valid) {
      return Response.json({ error: queryResult.error }, { status: 400 });
    }

    const modeResult = validateMode(mode);
    if (!modeResult.valid) {
      return Response.json({ error: modeResult.error }, { status: 400 });
    }

    const sanitizedQuery = sanitizeString(query);
    const sanitizedTheme = theme ? sanitizeString(theme) : undefined;
    const systemPrompt = getSystemPrompt(mode as QueryMode, sanitizedTheme, lens);
    const t0 = Date.now();

    // Build Pinecone filter
    const pineconeFilter: Record<string, unknown> = {};
    if (filters?.category) {
      pineconeFilter.category = { $eq: sanitizeString(filters.category) };
    }
    if (filters?.data_type_prefix) {
      pineconeFilter.data_type_prefix = { $eq: sanitizeString(filters.data_type_prefix) };
    }

    const encoder = new TextEncoder();
    const fullResponse: string[] = [];

    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Embed query — use HyDE for longer queries (>5 words) where semantic expansion helps.
          // Short queries have precise embeddings without expansion, saving ~400-700ms latency.
          let textToEmbed = sanitizedQuery;
          if (sanitizedQuery.trim().split(/\s+/).length > 5) {
            try {
              const hydeDoc = await generateHypotheticalDocument(sanitizedQuery);
              if (hydeDoc) textToEmbed = hydeDoc;
            } catch {
              // fallback: textToEmbed stays as sanitizedQuery
            }
          }
          const embedding = await embedQuery(textToEmbed);
          const embedMs = Date.now() - t0;

          // Search Pinecone — synthetic chunks included only for explain mode (most benefit from cached context).
          const matches = await queryPinecone(
            embedding,
            DEFAULT_TOP_K,
            Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
            { includeSynthetic: mode === "explain" }
          );

          const pineconeMs = Date.now() - t0 - embedMs;
          let filteredMatches = matches.filter(m => (m.score ?? 0) >= MIN_SCORE_THRESHOLD);

          const filtersApplied = Object.keys(pineconeFilter).length > 0;

          // Guard: no results from Pinecone — stream error event instead of skipping to LLM
          if (filteredMatches.length === 0) {
            if (filtersApplied) {
              // Re-query without filters to determine if results exist at all
              const unfilteredMatches = await queryPinecone(embedding, DEFAULT_TOP_K);
              const unfilteredFiltered = unfilteredMatches.filter(m => (m.score ?? 0) >= MIN_SCORE_THRESHOLD);
              if (unfilteredFiltered.length > 0) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: "error", data: "No results for the selected filters — try removing them to see all matches." })}\n\n`)
                );
                controller.close();
                return;
              }
            }
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "error", data: "No matching routines found for your query." })}\n\n`)
            );
            controller.close();
            return;
          }

          // Graph expansion: only for dependencies mode (other modes don't benefit from dep context)
          let expansionMs = 0;
          let allMatches = filteredMatches;
          if (mode === "dependencies") {
            const seen = new Set(filteredMatches.map((m) => (m.metadata?.subroutine_name as string)));
            const depsToFetch: string[] = [];
            for (const m of filteredMatches) {
              const depStr = (m.metadata?.dependencies as string) || '';
              const deps = depStr.split(', ').filter(Boolean);
              for (const dep of deps) {
                if (!seen.has(dep)) {
                  depsToFetch.push(dep);
                  seen.add(dep);
                }
              }
            }
            const expanded = await fetchRoutinesByNames([...new Set(depsToFetch)]);
            expansionMs = Date.now() - t0 - embedMs - pineconeMs;
            console.log(`[graph-expansion] initial=${filteredMatches.length} deps_to_fetch=${depsToFetch.length} expanded=${expanded.length}`);
            allMatches = [...filteredMatches, ...expanded].slice(0, GRAPH_EXPANSION_MAX_CHUNKS);
          } else {
            console.log(`[graph-expansion] skipped for mode=${mode}`);
          }

          // Build context
          const userMessage = buildUserMessage(sanitizedQuery, allMatches as { metadata: Record<string, unknown>; score?: number }[]);

          // Stream response from GPT-4o-mini
          const MODE_MAX_TOKENS: Record<QueryMode, number> = {
            explain: 2000,
            dependencies: 2000,
            docs: 1000,
            translate: 1000,
          };
          const stream = await getOpenAI().chat.completions.create({
            model: CHAT_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              ...history.slice(-10),
              { role: "user", content: userMessage },
            ],
            stream: true,
            temperature: TEMPERATURE,
            max_tokens: MODE_MAX_TOKENS[mode as QueryMode],
          });

          // Send chunks metadata first — exclude synthetic cached-answer chunks,
          // which lack subroutine_name/kind/category and can't be rendered by CodeSnippet.
          const chunksData = allMatches
            .filter((m) => !m.metadata?.is_synthetic)
            .map((m) => ({
              id: m.id,
              score: m.score,
              metadata: m.metadata,
            }));
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "chunks", data: chunksData })}\n\n`)
          );

          // Stream LLM response, buffering for post-response synthetic upsert
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              fullResponse.push(content);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", data: content })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          const totalMs = Date.now() - t0;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "timing", data: { embedMs, pineconeMs, expansionMs, totalMs } })}\n\n`)
          );
          controller.close();

          // After the response is sent, cache the LLM answer back to Pinecone as a synthetic chunk.
          // Only upsert if the stream produced content — skip on error before any LLM output.
          // `after()` runs after the response is flushed but before the serverless function exits.
          if (fullResponse.length > 0) {
            const routineNames = allMatches
              .map((m) => m.metadata?.subroutine_name as string)
              .filter(Boolean);
            after(
              upsertSyntheticChunk(sanitizedQuery, fullResponse.join(""), routineNames).catch(
                console.error
              )
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", data: message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Query error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
