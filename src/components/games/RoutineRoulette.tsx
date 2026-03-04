"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
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

const SAMPLE_NAMES = [
  "DGESV", "DGEMM", "DSYEV", "DGETRF", "DGEQRF", "DPOTRF", "DGESVD",
  "DGELS", "DSYTRD", "DGEBRD", "DLANGE", "DLASWP", "DTRSM", "DSYRK",
  "DGEMV", "DTRMM", "DSCAL", "DAXPY", "DDOT", "DNRM2", "ZHEEV",
  "SGESV", "CGESV", "ZGESV", "SGEMM", "CGEMM", "ZGEMM", "SPOTRF",
  "DGGEV", "DGEES", "DGEEV", "DSTEV", "DPBSV", "DGBSV", "DSPSV",
];

const TOTAL_TICKS = 25;

/**
 * Drives the roulette name cycling via a spring-based index.
 * The spring animates from 0 to TOTAL_TICKS, and at each integer
 * we pick a sample name. The spring's natural deceleration creates
 * the "slowing down" feel without manual interval cascading.
 */
function SpinningName({ spinning, finalName }: { spinning: boolean; finalName: string | null }) {
  const springIndex = useSpring(0, {
    stiffness: 30,
    damping: 20,
    mass: 1,
  });
  const nameIndex = useTransform(springIndex, (v) => {
    const idx = Math.floor(v) % SAMPLE_NAMES.length;
    return idx < 0 ? idx + SAMPLE_NAMES.length : idx;
  });
  const [display, setDisplay] = useState(SAMPLE_NAMES[0]);

  useEffect(() => {
    if (spinning) {
      springIndex.jump(0);
      springIndex.set(TOTAL_TICKS);
    }
  }, [spinning, springIndex]);

  useEffect(() => {
    const unsub = nameIndex.on("change", (v) => {
      setDisplay(SAMPLE_NAMES[v]);
    });
    return unsub;
  }, [nameIndex]);

  // When finalName arrives and spinning stops, show it
  const shown = !spinning && finalName ? finalName : display;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={shown}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.12 }}
        className={`font-mono text-lg font-bold text-white ${
          spinning ? "animate-pulse" : ""
        }`}
      >
        {shown || "..."}
      </motion.span>
    </AnimatePresence>
  );
}

export default function RoutineRoulette() {
  const [routine, setRoutine] = useState<{ id: string; metadata: ChunkData["metadata"] } | null>(null);
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const abortRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const streamExplanation = useCallback(async (name: string) => {
    setIsLoading(true);
    setAnswer("");
    setChunks([]);

    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `What does ${name} do?`, mode: "explain" }),
        signal,
      });

      if (!response.ok) throw new Error("Query failed");

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
      if (signal.aborted) return;
      console.error("Stream error:", error);
      setAnswer("Failed to load explanation. Try spinning again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSpin = useCallback(async () => {
    // Abort any in-flight explanation
    if (abortRef.current) abortRef.current.abort();

    setSpinning(true);
    setRoutine(null);
    setAnswer("");
    setChunks([]);
    setIsLoading(false);
    setDisplayName("");

    try {
      const response = await fetch("/api/games/random?count=1");
      if (!response.ok) throw new Error("Failed to fetch random routine");
      const data = await response.json();
      const fetched = data.routines[0] as { id: string; metadata: ChunkData["metadata"] } | undefined;

      // Wait for spring animation to settle (~2s)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (!fetched) {
        setDisplayName("???");
        setSpinning(false);
        setAnswer("No routines found. Please try again.");
        return;
      }

      const name = fetched.metadata.subroutine_name;
      setDisplayName(name);
      setRoutine(fetched);
      setSpinning(false);

      // Stream explanation
      streamExplanation(name);
    } catch (error) {
      console.error("Spin error:", error);
      setDisplayName("???");
      setSpinning(false);
      setAnswer("Something went wrong. Try spinning again.");
    }
  }, [streamExplanation]);

  const handleSpinAgain = useCallback(() => {
    handleSpin();
  }, [handleSpin]);

  return (
    <div className="space-y-8">
      {/* Spin area */}
      <div className="flex flex-col items-center gap-6">
        {/* Decorative ring + button */}
        <div className="relative flex items-center justify-center">
          {/* Outer decorative ring */}
          <div
            className={`absolute h-40 w-40 rounded-full border-4 border-dashed border-ll-primary-faint ${
              spinning ? "animate-spin" : ""
            }`}
          />
          {/* Inner decorative ring */}
          <div
            className={`absolute h-36 w-36 rounded-full border-2 border-ll-primary-faint ${
              spinning ? "animate-spin [animation-direction:reverse]" : ""
            }`}
          />
          {/* Spin button */}
          {!routine && !spinning ? (
            <button
              onClick={handleSpin}
              className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-ll-primary text-xl font-bold text-ll-on-primary shadow-lg transition-transform hover:scale-105 hover:bg-ll-primary-hover active:scale-95"
            >
              SPIN
            </button>
          ) : (
            <div
              className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-full ${
                spinning
                  ? "bg-ll-primary shadow-xl"
                  : "bg-ll-surface-tonal"
              }`}
            >
              <SpinningName spinning={spinning} finalName={displayName || null} />
            </div>
          )}
        </div>

        {/* Subtitle */}
        {!routine && !spinning && (
          <p className="text-sm text-ll-on-surface-muted">
            Discover a random LAPACK/BLAS routine
          </p>
        )}

        {spinning && (
          <p className="text-sm font-medium text-ll-primary animate-pulse">
            Finding a routine...
          </p>
        )}
      </div>

      {/* Result display */}
      <AnimatePresence mode="wait">
        {routine && (
          <motion.div
            key={routine.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="space-y-6"
          >
            {/* Routine header */}
            <div className="rounded-lg border border-ll-outline bg-ll-surface-variant p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-mono text-2xl font-bold text-ll-on-surface">
                  {routine.metadata.subroutine_name}
                </h2>
                <span className="rounded-full bg-ll-surface-tonal px-2.5 py-0.5 text-xs font-medium text-ll-on-surface-muted">
                  {routine.metadata.kind}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    routine.metadata.category === "BLAS"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  }`}
                >
                  {routine.metadata.category}
                </span>
                {routine.metadata.data_type_prefix && (
                  <span className="rounded-full bg-ll-surface-tonal px-2.5 py-0.5 text-xs font-medium text-ll-on-surface-muted">
                    {routine.metadata.data_type_prefix}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ll-on-surface-muted">
                {routine.metadata.file_path}:{routine.metadata.line_start}-{routine.metadata.line_end}
              </p>
              {routine.metadata.parameters && (
                <p className="mt-1 text-sm text-ll-on-surface-muted">
                  Parameters: <span className="font-mono text-xs">{routine.metadata.parameters}</span>
                </p>
              )}
              {routine.metadata.dependencies && (
                <p className="mt-1 text-sm text-ll-on-surface-muted">
                  Calls: <span className="font-mono text-xs">{routine.metadata.dependencies}</span>
                </p>
              )}

              {/* Code preview */}
              <div className="mt-4 max-h-48 overflow-auto rounded-md bg-zinc-950 p-4">
                <pre className="text-xs leading-relaxed text-zinc-300">
                  <code>{routine.metadata.text}</code>
                </pre>
              </div>
            </div>

            {/* Streamed explanation */}
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ll-on-surface-muted">
                Explanation
              </h3>
              <AnswerStream content={answer} isStreaming={isLoading} />
            </div>

            {/* Code chunks from RAG */}
            {chunks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-ll-on-surface-muted">
                  Related Code ({chunks.length} chunks)
                </h3>
                {chunks.map((chunk) => (
                  <CodeSnippet key={chunk.id} chunk={chunk} />
                ))}
              </div>
            )}

            {/* Spin Again */}
            <div className="flex justify-center">
              <button
                onClick={handleSpinAgain}
                disabled={spinning}
                className="rounded-full bg-ll-primary px-8 py-3 font-semibold text-ll-on-primary shadow transition-transform hover:scale-105 hover:bg-ll-primary-hover active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                Spin Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
