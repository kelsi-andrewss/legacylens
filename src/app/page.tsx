"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import SearchBar from "@/components/SearchBar";
import ModeSelector from "@/components/ModeSelector";
import AnswerStream from "@/components/AnswerStream";
import CodeSnippet, { type ChunkData } from "@/components/CodeSnippet";
import { useTheme } from "@/components/ThemeProvider";
import Pokedex, { saveRoutineMeta } from "@/components/Pokedex";
import { markDiscovered, isDiscovered, addXP, getStats } from "@/lib/pokedex";
import Scratchpad, { type PinnedItem } from "@/components/Scratchpad";
import ChallengeToast from "@/components/ChallengeToast";
import { shouldTriggerChallenge, generateChallenge, type Challenge } from "@/lib/challenges";

const SCRATCHPAD_KEY = "ll-scratchpad";

function loadPinnedItems(): PinnedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SCRATCHPAD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [mode, setMode] = useState("explain");
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [exampleQuery, setExampleQuery] = useState<string | undefined>();
  const { resolvedTheme } = useTheme();
  const resolvedThemeRef = useRef(resolvedTheme);
  resolvedThemeRef.current = resolvedTheme;
  const [showPokedex, setShowPokedex] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>(loadPinnedItems);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<string | null>(null);

  const handleRoutineHover = useCallback((name: string | null) => {
    setActiveRoutine(name);
  }, []);

  useEffect(() => {
    localStorage.setItem(SCRATCHPAD_KEY, JSON.stringify(pinnedItems));
  }, [pinnedItems]);

  const pinnedIds = new Set(pinnedItems.map((p) => p.id));
  const routineNames = useMemo(
    () => [...new Set(chunks.map((c) => c.metadata.subroutine_name).filter(Boolean))],
    [chunks]
  );

  const handlePin = useCallback((chunk: ChunkData) => {
    setPinnedItems((prev) => {
      if (prev.some((p) => p.id === chunk.id)) return prev;
      return [
        ...prev,
        {
          id: chunk.id,
          subroutine_name: chunk.metadata.subroutine_name,
          kind: chunk.metadata.kind,
          file_path: chunk.metadata.file_path,
          text: chunk.metadata.text,
          annotation: "",
          pinnedAt: Date.now(),
        },
      ];
    });
  }, []);

  const handleRemovePin = useCallback((id: string) => {
    setPinnedItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleReorder = useCallback((id: string, direction: "up" | "down") => {
    setPinnedItems((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  }, []);

  const handleAnnotate = useCallback((id: string, annotation: string) => {
    setPinnedItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, annotation } : p))
    );
  }, []);

  const handleChallengeComplete = useCallback((xpReward: number) => {
    addXP(xpReward);
    setActiveChallenge(null);
  }, []);

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
          body: JSON.stringify({ query, mode: activeMode, filters: Object.keys(filters).length > 0 ? filters : undefined, theme: resolvedThemeRef.current }),
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
                const receivedChunks = event.data as ChunkData[];
                setChunks(receivedChunks);
                for (const chunk of receivedChunks) {
                  const name = chunk.metadata.subroutine_name;
                  if (name) {
                    const alreadyKnown = isDiscovered(name);
                    markDiscovered(name);
                    saveRoutineMeta(name, chunk.metadata.category, chunk.metadata.data_type_prefix);
                    if (!alreadyKnown) {
                      addXP(10);
                    }
                  }
                }
                // Check for challenge trigger after discoveries
                const stats = getStats();
                if (shouldTriggerChallenge(stats)) {
                  const randomChunk = receivedChunks[Math.floor(Math.random() * receivedChunks.length)];
                  if (randomChunk) {
                    const challenge = generateChallenge(randomChunk.metadata);
                    setActiveChallenge(challenge);
                  }
                }
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
            <div className="flex items-center justify-end">
              <button
                onClick={() => setShowPokedex((prev) => !prev)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  showPokedex
                    ? "bg-ll-primary-container text-ll-on-primary-container"
                    : "border border-ll-outline text-ll-on-surface-muted hover:bg-ll-surface-tonal"
                }`}
              >
                {showPokedex ? "Back to Search" : "Collection"}
              </button>
            </div>

            {showPokedex ? (
              <Pokedex />
            ) : (
            <>
            <SearchBar
              onSearch={handleSearch}
              isLoading={isLoading}
              externalQuery={exampleQuery}
            />
            <ModeSelector mode={mode} onModeChange={setMode} />

            {(answer || isLoading) && (
              <AnswerStream
                content={answer}
                isStreaming={isLoading}
                routineNames={routineNames}
                activeRoutine={activeRoutine}
                onRoutineHover={handleRoutineHover}
              />
            )}

            {chunks.length > 0 && (
              <div className="ghost-map-container space-y-4 reveal-enter">
                <h2 className="text-lg font-semibold text-ll-on-surface">
                  Retrieved Code ({chunks.length} chunks)
                </h2>
                {chunks.map((chunk, index) => (
                  <div key={chunk.id} className="ghost-map-item reveal-enter" style={{ animationDelay: `${index * 80}ms` }}>
                    <CodeSnippet
                      chunk={chunk}
                      onPin={handlePin}
                      isPinned={pinnedIds.has(chunk.id)}
                      activeRoutine={activeRoutine}
                      onRoutineHover={handleRoutineHover}
                    />
                  </div>
                ))}
              </div>
            )}

            {!answer && !isLoading && chunks.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-ll-on-surface-muted">
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
                      className="rounded-lg border border-ll-outline bg-ll-surface-variant px-4 py-3 text-left transition-colors hover:border-ll-primary hover:bg-ll-primary-container"
                    >
                      <span className="mb-1.5 inline-block rounded-full bg-ll-primary-container px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ll-on-primary-container">
                        {exampleMode}
                      </span>
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
            </>
            )}
          </div>

          {/* Scratchpad sidebar (desktop) */}
          <Scratchpad
            items={pinnedItems}
            onRemove={handleRemovePin}
            onReorder={handleReorder}
            onAnnotate={handleAnnotate}
          />
        </div>
      </main>

      {activeChallenge && (
        <ChallengeToast
          challenge={activeChallenge}
          onComplete={handleChallengeComplete}
        />
      )}
    </div>
  );
}
