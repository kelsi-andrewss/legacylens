import { NextRequest, after } from "next/server";
import { embedQuery, getOpenAI } from "@/lib/openai";
import { queryPinecone, fetchRoutinesByNames, upsertSyntheticChunk } from "@/lib/pinecone";
import { QueryMode, getSystemPrompt, buildUserMessage } from "@/lib/prompts";
import { CHAT_MODEL, TEMPERATURE, MAX_TOKENS, DEFAULT_TOP_K, GRAPH_EXPANSION_MAX_CHUNKS, MIN_SCORE_THRESHOLD } from "@/lib/config";
import { validateQuery, validateMode, sanitizeString } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, mode = "explain", filters, theme } = body as {
      query: string;
      mode?: QueryMode;
      filters?: { category?: string; data_type_prefix?: string };
      theme?: string;
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

    // Build Pinecone filter
    const pineconeFilter: Record<string, unknown> = {};
    if (filters?.category) {
      pineconeFilter.category = { $eq: sanitizeString(filters.category) };
    }
    if (filters?.data_type_prefix) {
      pineconeFilter.data_type_prefix = { $eq: sanitizeString(filters.data_type_prefix) };
    }

    // Embed query
    const embedding = await embedQuery(sanitizedQuery);

    // Search Pinecone — synthetic chunks included only for explain mode (most benefit from cached context).
    const matches = await queryPinecone(
      embedding,
      DEFAULT_TOP_K,
      Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined,
      { includeSynthetic: mode === "explain" }
    );

    const filteredMatches = matches.filter(m => (m.score ?? 0) >= MIN_SCORE_THRESHOLD);
    const filtersApplied = Object.keys(pineconeFilter).length > 0;

    // Guard: no results from Pinecone — skip LLM call entirely
    if (filteredMatches.length === 0) {
      if (filtersApplied) {
        // Re-query without filters to determine if results exist at all
        const unfilteredMatches = await queryPinecone(embedding, DEFAULT_TOP_K);
        const unfilteredFiltered = unfilteredMatches.filter(m => (m.score ?? 0) >= MIN_SCORE_THRESHOLD);
        if (unfilteredFiltered.length > 0) {
          return Response.json(
            { error: "No results for the selected filters — try removing them to see all matches." },
            { status: 404 }
          );
        }
      }
      return Response.json({ error: "No matching routines found for your query." }, { status: 404 });
    }

    // Graph expansion: fetch direct dependencies of initial results (depth=1)
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
    console.log(`[graph-expansion] initial=${filteredMatches.length} deps_to_fetch=${depsToFetch.length} expanded=${expanded.length}`);
    const allMatches = [...filteredMatches, ...expanded].slice(0, GRAPH_EXPANSION_MAX_CHUNKS);

    // Build context
    const systemPrompt = getSystemPrompt(mode as QueryMode, sanitizedTheme);
    const userMessage = buildUserMessage(sanitizedQuery, allMatches as { metadata: Record<string, unknown>; score?: number }[]);

    // Stream response from GPT-4o-mini
    const stream = await getOpenAI().chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    });

    // Convert to ReadableStream
    const encoder = new TextEncoder();
    const fullResponse: string[] = [];
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send chunks metadata first
          const chunksData = allMatches.map((m) => ({
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
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", data: message })}\n\n`)
          );
          controller.close();
        } finally {
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
        }
      },
    });

    return new Response(readable, {
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
