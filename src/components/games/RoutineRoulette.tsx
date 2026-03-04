"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

export default function RoutineRoulette() {
  const [routine, setRoutine] = useState<{ id: string; metadata: ChunkData["metadata"] } | null>(null);
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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

    // Start cycling animation
    let tick = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      tick++;
      setDisplayName(SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)]);
      // Slow down after ~15 ticks by clearing and restarting at slower rate
      if (tick === 15) {
        clearInterval(intervalRef.current!);
        intervalRef.current = setInterval(() => {
          setDisplayName(SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)]);
        }, 200);
      }
      if (tick === 20) {
        clearInterval(intervalRef.current!);
        intervalRef.current = setInterval(() => {
          setDisplayName(SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)]);
        }, 350);
      }
    }, 80);

    try {
      const response = await fetch("/api/games/random?count=1");
      if (!response.ok) throw new Error("Failed to fetch random routine");
      const data = await response.json();
      const fetched = data.routines[0] as { id: string; metadata: ChunkData["metadata"] } | undefined;

      // Wait for animation to finish (~2s total)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;

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
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
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
            className={`absolute h-40 w-40 rounded-full border-4 border-dashed border-blue-300 dark:border-blue-700 ${
              spinning ? "animate-spin" : ""
            }`}
          />
          {/* Inner decorative ring */}
          <div
            className={`absolute h-36 w-36 rounded-full border-2 border-blue-200 dark:border-blue-800 ${
              spinning ? "animate-spin [animation-direction:reverse]" : ""
            }`}
          />
          {/* Spin button */}
          {!routine && !spinning ? (
            <button
              onClick={handleSpin}
              className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95"
            >
              SPIN
            </button>
          ) : (
            <div
              className={`relative z-10 flex h-32 w-32 items-center justify-center rounded-full ${
                spinning
                  ? "bg-blue-500 shadow-blue-500/30 shadow-xl"
                  : "bg-zinc-800 dark:bg-zinc-700"
              }`}
            >
              <span
                className={`font-mono text-lg font-bold text-white ${
                  spinning ? "animate-pulse" : ""
                }`}
              >
                {displayName || "..."}
              </span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        {!routine && !spinning && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Discover a random LAPACK/BLAS routine
          </p>
        )}

        {spinning && (
          <p className="text-sm font-medium text-blue-500 animate-pulse">
            Finding a routine...
          </p>
        )}
      </div>

      {/* Result display */}
      {routine && (
        <div className="space-y-6">
          {/* Routine header */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {routine.metadata.subroutine_name}
              </h2>
              <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
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
                <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                  {routine.metadata.data_type_prefix}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {routine.metadata.file_path}:{routine.metadata.line_start}-{routine.metadata.line_end}
            </p>
            {routine.metadata.parameters && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Parameters: <span className="font-mono text-xs">{routine.metadata.parameters}</span>
              </p>
            )}
            {routine.metadata.dependencies && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
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
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Explanation
            </h3>
            <AnswerStream content={answer} isStreaming={isLoading} />
          </div>

          {/* Code chunks from RAG */}
          {chunks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
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
              className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              Spin Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
