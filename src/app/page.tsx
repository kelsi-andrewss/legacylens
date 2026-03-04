"use client";

import { useState, useCallback, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import ModeSelector from "@/components/ModeSelector";
import AnswerStream from "@/components/AnswerStream";
import CodeSnippet from "@/components/CodeSnippet";
import TutorialBanner, { TOUR_STEPS } from "@/components/TutorialBanner";

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
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [tutorialPendingQuery, setTutorialPendingQuery] = useState<string | null>(null);

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

  // Phase 1 effect: fires when tutorialStep changes
  useEffect(() => {
    if (tutorialStep === null) return;
    const step = TOUR_STEPS[tutorialStep];

    // Apply filters — except filter-action steps (user must click)
    if (step.waitFor !== "filter") {
      if (step.filters?.category !== undefined) setCategoryFilter(step.filters.category);
      if (step.filters?.dataType !== undefined) setTypeFilter(step.filters.dataType);
    }

    if (step.query === null) return; // commentary-only: keep existing results

    setAnswer("");
    setChunks([]);

    if (step.waitFor === "search") {
      // Pre-fill only — user presses Search manually
      setMode(step.mode);
      return;
    }

    if (step.waitFor === "mode") {
      // Queue query but don't set mode — Phase 2 fires when user clicks the mode pill
      setTutorialPendingQuery(step.query);
      return;
    }

    setMode(step.mode);
    setTutorialPendingQuery(step.query);
  }, [tutorialStep]);

  // Phase 2 effect: fires when mode or tutorialPendingQuery changes — executes search once mode matches
  useEffect(() => {
    if (tutorialPendingQuery === null || tutorialStep === null) return;
    if (mode !== TOUR_STEPS[tutorialStep].mode) return;
    const query = tutorialPendingQuery;
    setTutorialPendingQuery(null);
    const timer = setTimeout(() => handleSearch(query), 500);
    return () => clearTimeout(timer);
  }, [mode, tutorialPendingQuery, tutorialStep, handleSearch]);

  // Auto-advance effect: fires when loading completes with a result during tour
  // Null-query steps and waitFor steps are excluded from auto-advance
  useEffect(() => {
    if (tutorialStep === null || isLoading || answer.length === 0) return;
    if (TOUR_STEPS[tutorialStep].query === null) return;
    if (TOUR_STEPS[tutorialStep].waitFor === "search") return; // auto-advance after manual search is fine, let it through
    const timer = setTimeout(() => {
      if (tutorialStep < TOUR_STEPS.length - 1) {
        setTutorialStep((t) => (t !== null ? t + 1 : null));
      } else {
        setTutorialStep(null);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoading, answer, tutorialStep]);

  // Filter-action advance: fires when user clicks the expected filter during a waitFor:"filter" step
  useEffect(() => {
    if (tutorialStep === null) return;
    const step = TOUR_STEPS[tutorialStep];
    if (step.waitFor !== "filter") return;
    if (step.filters?.category === undefined) return;
    if (categoryFilter !== step.filters.category) return;
    setTutorialStep((t) => (t !== null && t < TOUR_STEPS.length - 1 ? t + 1 : null));
  }, [categoryFilter, tutorialStep]);

  const tourHighlight = tutorialStep !== null ? TOUR_STEPS[tutorialStep].highlight : undefined;
  const highlightClass = (region: string) => {
    if (tourHighlight !== region) return "";
    const isAction = tutorialStep !== null && !!TOUR_STEPS[tutorialStep].waitFor;
    return isAction
      ? "ring-2 ring-blue-500 ring-offset-2 rounded-lg animate-pulse"
      : "ring-2 ring-blue-400 ring-offset-2 rounded-lg";
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
          <button
            onClick={() => { setTutorialStep(0); setCategoryFilter(""); setTypeFilter(""); }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
          >
            ▶ Start Tour
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className={`hidden w-48 shrink-0 lg:block ${highlightClass("sidebar")}`}>
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
            <div className={highlightClass("search")}>
              <SearchBar
                onSearch={handleSearch}
                isLoading={isLoading}
                externalQuery={tutorialStep !== null ? (TOUR_STEPS[tutorialStep].query ?? undefined) : undefined}
              />
            </div>
            <div className={highlightClass("mode")}>
              <ModeSelector mode={mode} onModeChange={setMode} />
            </div>

            {(answer || isLoading) && (
              <div className={highlightClass("answer")}>
                <AnswerStream content={answer} isStreaming={isLoading} />
              </div>
            )}

            {chunks.length > 0 && (
              <div className={`space-y-4 ${highlightClass("chunks")}`}>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Retrieved Code ({chunks.length} chunks)
                </h2>
                {chunks.map((chunk) => (
                  <CodeSnippet key={chunk.id} chunk={chunk} />
                ))}
              </div>
            )}

            {!answer && !isLoading && chunks.length === 0 && (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
                <p className="text-zinc-500 dark:text-zinc-400">
                  Try asking about a LAPACK routine, like &quot;What does DGESV do?&quot; or &quot;How does LU factorization work in LAPACK?&quot;
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      {tutorialStep !== null && (
        <TutorialBanner
          step={tutorialStep}
          onNext={() => {
            if (tutorialStep < TOUR_STEPS.length - 1) setTutorialStep((t) => (t !== null ? t + 1 : null));
            else setTutorialStep(null);
          }}
          onExit={() => setTutorialStep(null)}
        />
      )}
    </div>
  );
}
