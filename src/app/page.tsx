"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import SearchBar from "@/components/SearchBar";
import ModeSelector from "@/components/ModeSelector";
import AnswerStream from "@/components/AnswerStream";
import CodeSnippet, { type ChunkData } from "@/components/CodeSnippet";
import Pokedex, { saveRoutineMeta } from "@/components/Pokedex";
import { markDiscovered, isDiscovered, addXP, getStats, markAllAsSeen, hasUnseenDiscoveries } from "@/lib/pokedex";
import { type Lens } from "@/lib/prompts";
import Scratchpad, { type PinnedItem } from "@/components/Scratchpad";
import ChallengeToast from "@/components/ChallengeToast";
import { shouldTriggerChallenge, generateChallenge, type Challenge } from "@/lib/challenges";
import SuggestedSearches from "@/components/SuggestedSearches";
import { Library, X } from "lucide-react";

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
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [mode, setMode] = useState("explain");
  const [lens, setLens] = useState<Lens | undefined>(undefined);
  const lensRef = useRef<Lens | undefined>(undefined);
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [lastQuery, setLastQuery] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [exampleQuery, setExampleQuery] = useState<string | undefined>();
  const [showPokedex, setShowPokedex] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<PinnedItem[]>(loadPinnedItems);
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<string | null>(null);
  const [discoveredCount, setDiscoveredCount] = useState(0);
  const [hasUnseen, setHasUnseen] = useState(false);

  useEffect(() => {
    const stats = getStats();
    setDiscoveredCount(stats.discovered);
    setHasUnseen(hasUnseenDiscoveries());
  }, []);

  const handleLensChange = useCallback((newLens: Lens | undefined) => {
    setLens(newLens);
    lensRef.current = newLens;
  }, []);

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
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const activeMode = modeOverride || mode;
      // Capture messages before any await — state reads after await see stale values
      const currentMessages = messages;
      setIsLoading(true);
      setAnswer("");
      setChunks([]);

      if (query.trim()) {
        setLastQuery(query);
      }

      try {
        const response = await fetch("/api/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, mode: activeMode, lens: lensRef.current, history: currentMessages }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Query failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let buffer = "";
        const responseChunks: string[] = [];

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
                setDiscoveredCount(getStats().discovered);
                setHasUnseen(hasUnseenDiscoveries());
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
                responseChunks.push(event.data as string);
                setAnswer((prev) => prev + event.data);
              } else if (event.type === "error") {
                setAnswer(event.data as string);
                setIsLoading(false);
              }
            } catch {
              // skip malformed
            }
          }
        }

        // Append user query and assistant response to conversation history
        const fullResponse = responseChunks.join("");
        if (query.trim() && fullResponse) {
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: query },
            { role: 'assistant', content: fullResponse },
          ]);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Search error:", error);
        setAnswer("An error occurred while searching. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [mode, messages]
  );

  const handleRoutineClick = useCallback(
    (name: string) => {
      const q = `Explain ${name}`;
      setExampleQuery(q);
      handleSearch(q);
    },
    [handleSearch]
  );

  const handleModeChange = useCallback((newMode: string) => {
    setMode(newMode);
    if (lastQuery && (chunks.length > 0 || answer)) {
      handleSearch(lastQuery, newMode);
    }
  }, [lastQuery, chunks, answer, handleSearch]);

  const filteredChunks = chunks.filter((chunk) => {
    if (categoryFilter && chunk.metadata.category !== categoryFilter) return false;
    if (typeFilter && chunk.metadata.data_type_prefix !== typeFilter) return false;
    return true;
  });

  const filtersActive = categoryFilter !== "" || typeFilter !== "";

  const runExample = (query: string, exampleMode: string) => {
    setMode(exampleMode);
    setExampleQuery(query);
    handleSearch(query, exampleMode);
  };

  const handleSuggestedSelect = useCallback((query: string) => {
    setExampleQuery(query);
    handleSearch(query);
  }, [handleSearch]);

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
                onClick={() => {
                setShowPokedex((prev) => {
                  if (!prev) {
                    markAllAsSeen();
                    setHasUnseen(false);
                  }
                  return !prev;
                });
              }}
                className={`relative group overflow-visible flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${
                  showPokedex
                    ? "archive-btn-active"
                    : "archive-btn text-ll-on-surface"
                }`}
              >
                {hasUnseen && !showPokedex && (
                  <span className="notification-bubble-shimmer absolute -top-1.5 -right-1.5" aria-label="New discoveries" />
                )}
                {showPokedex ? (
                  <>
                    <X size={18} className="rotate-90 transition-transform" />
                    <span>Close Archive</span>
                  </>
                ) : (
                  <>
                    <Library size={18} className="group-hover:scale-110 transition-transform" />
                    <span className="flex flex-col items-start leading-tight">
                      <span className="font-semibold">Discovery Archive</span>
                      <span className="hidden sm:block text-xs text-ll-on-surface-muted font-normal">
                        {discoveredCount > 0 ? `${discoveredCount} discovered` : "start exploring"}
                      </span>
                    </span>
                  </>
                )}
              </button>
            </div>

            {showPokedex ? (
              <Pokedex />
            ) : (
            <>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <SearchBar
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  externalQuery={exampleQuery}
                />
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="mt-1 shrink-0 rounded-md border border-ll-outline px-3 py-2 text-sm text-ll-on-surface-muted transition-colors hover:border-ll-primary hover:text-ll-on-surface"
                  title="Clear conversation history"
                >
                  Clear
                </button>
              )}
            </div>
            <SuggestedSearches onSelect={handleSuggestedSelect} />
            <ModeSelector mode={mode} onModeChange={handleModeChange} lens={lens} onLensChange={handleLensChange} />

            {(answer || isLoading) && (
              <AnswerStream
                content={answer}
                isStreaming={isLoading}
                routineNames={routineNames}
                activeRoutine={activeRoutine}
                onRoutineHover={handleRoutineHover}
                onRoutineClick={handleRoutineClick}
              />
            )}

            {chunks.length > 0 && (
              <div className="ghost-map-container space-y-4 reveal-enter">
                <h2 className="text-lg font-semibold text-ll-on-surface">
                  Retrieved Code ({filtersActive ? `${filteredChunks.length} of ${chunks.length} chunks` : `${chunks.length} chunks`})
                </h2>
                {filteredChunks.map((chunk, index) => (
                  <div key={chunk.id} className="ghost-map-item reveal-enter" style={{ animationDelay: `${index * 80}ms` }}>
                    <CodeSnippet
                      chunk={chunk}
                      onPin={handlePin}
                      isPinned={pinnedIds.has(chunk.id)}
                      activeRoutine={activeRoutine}
                      onRoutineHover={handleRoutineHover}
                      onRoutineClick={handleRoutineClick}
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
