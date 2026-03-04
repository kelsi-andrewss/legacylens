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
    async (query: string) => {
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
          body: JSON.stringify({ query, mode, filters: Object.keys(filters).length > 0 ? filters : undefined }),
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

  const runExample = (query: string) => {
    setExampleQuery(query);
    handleSearch(query);
  };

  return (
    <div className="min-h-screen bg-ll-surface">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden w-48 shrink-0 lg:block">
            <div className="sticky top-8 space-y-6">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted">
                  Category
                </h3>
                <div className="space-y-1">
                  {["", "LAPACK", "BLAS"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                        categoryFilter === cat
                          ? "bg-ll-primary-container text-ll-on-primary-container"
                          : "text-ll-on-surface-muted hover:bg-ll-surface-tonal"
                      }`}
                    >
                      {cat || "All"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted">
                  Data Type
                </h3>
                <div className="space-y-1">
                  {["", "S", "D", "C", "Z"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t)}
                      className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                        typeFilter === t
                          ? "bg-ll-primary-container text-ll-on-primary-container"
                          : "text-ll-on-surface-muted hover:bg-ll-surface-tonal"
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
                <h2 className="text-lg font-semibold text-ll-on-surface">
                  Retrieved Code ({chunks.length} chunks)
                </h2>
                {chunks.map((chunk) => (
                  <CodeSnippet key={chunk.id} chunk={chunk} />
                ))}
              </div>
            )}

            {!answer && !isLoading && chunks.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-ll-on-surface-muted">
                  Try an example:
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { query: "What does DGESV do?", desc: "Explain a routine" },
                    { query: "How does LU factorization work in LAPACK?", desc: "Explore a concept" },
                    { query: "What are the BLAS level-2 operations?", desc: "Survey a category" },
                  ].map(({ query, desc }) => (
                    <button
                      key={query}
                      onClick={() => runExample(query)}
                      className="rounded-lg border border-ll-outline bg-ll-surface-variant px-4 py-3 text-left transition-colors hover:border-ll-primary hover:bg-ll-primary-container"
                    >
                      <span className="block text-sm font-medium text-ll-on-surface">
                        &quot;{query}&quot;
                      </span>
                      <span className="mt-1 block text-xs text-ll-on-surface-muted">
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
