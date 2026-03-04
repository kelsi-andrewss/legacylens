"use client";

import { useState, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import ModeSelector from "@/components/ModeSelector";
import AnswerStream from "@/components/AnswerStream";
import CodeSnippet from "@/components/CodeSnippet";

interface ChunkData {
  id: string;
  score: number;
  metadata: {
    subroutine_name: string;
    kind: string;
    file_path: string;
    line_start: number;
    line_end: number;
    parameters: string;
    dependencies: string;
    data_type_prefix: string;
    category: string;
    text: string;
  };
}

export default function Home() {
  const [mode, setMode] = useState("explain");
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [exampleQuery, setExampleQuery] = useState<string | undefined>();

  const handleSearch = useCallback(
    async (query: string, modeOverride?: string) => {
      const activeMode = modeOverride || mode;
      setIsLoading(true);
      setAnswer("");
      setChunks([]);

      try {
        const filters: Record<string, string> = {};
        if (categoryFilter) filters.category = categoryFilter;
        if (typeFilter) filters.data_type_prefix = typeFilter;

        const response = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, mode: activeMode, filters: Object.keys(filters).length > 0 ? filters : undefined }),
        });

        if (!response.ok) {
          throw new Error("Query failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6);
            try {
              const event = JSON.parse(json);
              if (event.type === "chunks") {
                setChunks(event.data);
              } else if (event.type === "text") {
                setAnswer((prev) => prev + event.data);
              }
            } catch {
              // skip malformed
            }
          }
        }
      } catch (error) {
        console.error("Search error:", error);
        setAnswer("An error occurred while searching. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [mode, categoryFilter, typeFilter]
  );

  const runExample = (query: string, exampleMode: string) => {
    setMode(exampleMode);
    setExampleQuery(query);
    handleSearch(query, exampleMode);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            LegacyLens
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            RAG-powered LAPACK/BLAS code explorer — Ask questions about 600K+ lines of Fortran
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden w-48 shrink-0 lg:block">
            <div className="sticky top-8 space-y-6">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Category
                </h3>
                <div className="space-y-1">
                  {["", "LAPACK", "BLAS"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                        categoryFilter === cat
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {cat || "All"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Data Type
                </h3>
                <div className="space-y-1">
                  {["", "S", "D", "C", "Z"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                        typeFilter === t
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {t || "All"}
                      {t === "S" && " (Single)"}
                      {t === "D" && " (Double)"}
                      {t === "C" && " (Complex)"}
                      {t === "Z" && " (Double Complex)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-6">
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              externalQuery={exampleQuery}
            />
            <ModeSelector mode={mode} onModeChange={setMode} />

            {(answer || isLoading) && (
              <AnswerStream content={answer} isStreaming={isLoading} />
            )}

            {chunks.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Retrieved Code ({chunks.length} chunks)
                </h2>
                {chunks.map((chunk) => (
                  <CodeSnippet key={chunk.id} chunk={chunk} />
                ))}
              </div>
            )}

            {!answer && !isLoading && chunks.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Try an example:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { query: "What does DGESV do?", mode: "explain", desc: "Explain a routine" },
                    { query: "What routines does DGESV call?", mode: "dependencies", desc: "Map dependencies" },
                    { query: "Document the DGETRF subroutine", mode: "docs", desc: "Generate docs" },
                    { query: "Translate DGEMM to Python", mode: "translate", desc: "Translate to modern code" },
                  ].map(({ query, mode: exampleMode, desc }) => (
                    <button
                      key={query}
                      onClick={() => runExample(query, exampleMode)}
                      className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600 dark:hover:bg-blue-900/30"
                    >
                      <span className="mb-1.5 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {exampleMode}
                      </span>
                      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        &quot;{query}&quot;
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">
                        {desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
