#!/usr/bin/env node
// Evaluation harness for LegacyLens RAG — runs 10 test queries against the local API,
// measures latency to first token, and prints chunks for manual P@5 scoring.
// Usage: node scripts/eval.mjs
//        npm run eval

const API_URL = "http://localhost:3000/api/query";

const QUERIES = [
  // Basic retrieval
  { query: "What does DGESV do?",                            mode: "explain" },
  { query: "How does DGEMM work?",                           mode: "explain" },
  { query: "What is DLANGE?",                                mode: "explain" },
  // Dependency mapping
  { query: "What does DGETRF call?",                         mode: "dependencies" },
  { query: "Show the call graph for DGESV",                  mode: "dependencies" },
  // Documentation generation
  { query: "Generate documentation for ZHEEV",               mode: "docs" },
  { query: "Document the BLAS routine DAXPY",                mode: "docs" },
  // Translation hints
  { query: "How would I write DGEMM in Python?",             mode: "translate" },
  { query: "What's the modern equivalent of DGESVD?",        mode: "translate" },
  // Cross-cutting
  { query: "What's the difference between SGESV and DGESV?", mode: "explain" },
];

/** Parse a single SSE line into the parsed event object, or null. */
function parseSseLine(line) {
  if (!line.startsWith("data: ")) return null;
  try {
    return JSON.parse(line.slice(6));
  } catch {
    return null;
  }
}

/**
 * Run one query against the SSE endpoint. Returns:
 *   { latencyMs, chunks, timing }
 * chunks = [{ subroutine_name, score }]
 * timing = { embedMs, pineconeMs, expansionMs, totalMs } | null
 */
async function runQuery(query, mode) {
  const t0 = Date.now();

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, mode }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let latencyMs = null;
  let chunks = [];
  let timing = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Split on newlines; hold back the last (possibly incomplete) fragment.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const event = parseSseLine(line.trim());
      if (!event) continue;

      if (event.type === "chunks") {
        chunks = (event.data ?? []).map((c) => ({
          subroutine_name: c.metadata?.subroutine_name ?? c.id ?? "(unknown)",
          score: c.score != null ? Number(c.score.toFixed(4)) : null,
        }));
      }

      if (event.type === "text" && latencyMs === null) {
        // First text token — record latency.
        latencyMs = Date.now() - t0;
      }

      if (event.type === "timing") {
        timing = event.data;
      }

      if (event.type === "error") {
        throw new Error(`API error: ${event.data}`);
      }
      // "done" — keep reading; timing event follows it.
    }
  }

  return { latencyMs: latencyMs ?? Date.now() - t0, chunks, timing };
}

function pad(str, len) {
  const s = String(str ?? "");
  return s.length >= len ? s.slice(0, len) : s + " ".repeat(len - s.length);
}

async function main() {
  console.log(`\nLegacyLens Evaluation — ${new Date().toISOString()}`);
  console.log(`Target: ${API_URL}\n`);
  console.log("=".repeat(80));

  const summaryRows = [];

  for (let i = 0; i < QUERIES.length; i++) {
    const { query, mode } = QUERIES[i];
    const label = `[${i + 1}/${QUERIES.length}]`;

    console.log(`\n${label} Query : ${query}`);
    console.log(`${" ".repeat(label.length)} Mode  : ${mode}`);

    let result;
    try {
      result = await runQuery(query, mode);
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      summaryRows.push({
        query,
        mode,
        latencyMs: "ERR",
        chunksRetrieved: 0,
        first3: err.message.slice(0, 60),
      });
      continue;
    }

    const { latencyMs, chunks, timing } = result;

    console.log(`  Latency to first token : ${latencyMs} ms`);
    console.log(`  Chunks retrieved       : ${chunks.length}`);

    if (timing) {
      console.log(`  Timing breakdown:`);
      console.log(`    embed_ms      = ${timing.embedMs}`);
      console.log(`    pinecone_ms   = ${timing.pineconeMs}`);
      console.log(`    expansion_ms  = ${timing.expansionMs}`);
      console.log(`    total_ms      = ${timing.totalMs}`);
    }

    console.log(`  Chunks (for P@5 scoring):`);
    chunks.slice(0, 10).forEach((c, idx) => {
      const marker = idx < 5 ? "  <-- P@5" : "";
      console.log(`    ${idx + 1}. ${c.subroutine_name}  score=${c.score}${marker}`);
    });

    const first3 = chunks.slice(0, 3).map((c) => c.subroutine_name).join(", ");
    summaryRows.push({ query, mode, latencyMs, chunksRetrieved: chunks.length, first3 });
  }

  // Summary table
  console.log("\n" + "=".repeat(80));
  console.log("SUMMARY TABLE");
  console.log("=".repeat(80));
  const hdr =
    `${pad("Query", 46)} ${pad("Mode", 12)} ${pad("Latency(ms)", 11)} ` +
    `${pad("Chunks", 6)} First 3 chunks`;
  console.log(hdr);
  console.log("-".repeat(120));
  for (const r of summaryRows) {
    const row =
      `${pad(r.query, 46)} ${pad(r.mode, 12)} ${pad(r.latencyMs, 11)} ` +
      `${pad(r.chunksRetrieved, 6)} ${r.first3}`;
    console.log(row);
  }
  console.log("");

  // Quick latency assessment against <3s target from evaluation.md
  const numeric = summaryRows.map((r) => r.latencyMs).filter((v) => typeof v === "number");
  if (numeric.length > 0) {
    const avg = Math.round(numeric.reduce((a, b) => a + b, 0) / numeric.length);
    const max = Math.max(...numeric);
    const passing = numeric.filter((v) => v < 3000).length;
    console.log(`Latency: avg=${avg}ms  max=${max}ms  under-3s: ${passing}/${numeric.length}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
