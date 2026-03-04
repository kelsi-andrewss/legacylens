"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface RoutineMetadata {
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
}

interface Routine {
  id: string;
  metadata: RoutineMetadata;
}

const THRESHOLD = 70;
const ANIMATION_DURATION_MS = 1500;
const LS_KEY = "similarity-high-score";

function getCodePreview(text: string): string {
  return text.split("\n").slice(0, 3).join("\n");
}

function RoutineCard({ routine }: { routine: Routine }) {
  const m = routine.metadata;
  const categoryStyle =
    m.category === "BLAS"
      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
      : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";

  return (
    <div className="flex-1 min-w-0 rounded-lg border border-ll-outline bg-ll-surface-variant shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 flex-wrap border-b border-ll-outline bg-ll-surface-tonal px-4 py-3">
        <span className="font-mono text-sm font-bold text-ll-on-surface">
          {m.subroutine_name}
        </span>
        <span className="rounded-full bg-ll-surface-tonal px-2 py-0.5 text-xs font-medium text-ll-on-surface-muted">
          {m.kind}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryStyle}`}>
          {m.category}
        </span>
      </div>
      <div className="px-4 py-3">
        <pre className="font-mono text-xs text-ll-on-surface-muted whitespace-pre-wrap break-all leading-relaxed">
          {getCodePreview(m.text)}
        </pre>
      </div>
    </div>
  );
}

export default function SimilarityShowdown() {
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [routineA, setRoutineA] = useState<Routine | null>(null);
  const [routineB, setRoutineB] = useState<Routine | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [actualScore, setActualScore] = useState<number | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const animFrameRef = useRef<number>(0);
  const streakRef = useRef(streak);
  const highScoreRef = useRef(highScore);

  // Keep refs in sync with state
  streakRef.current = streak;
  highScoreRef.current = highScore;

  // Load high score from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) setHighScore(parsed);
    }
  }, []);

  const fetchPair = useCallback(async () => {
    setLoading(true);
    setRevealed(false);
    setActualScore(null);
    setDisplayScore(0);
    setResult(null);

    try {
      const res = await fetch("/api/games/random?count=2");
      const data = await res.json();
      if (data.routines && data.routines.length >= 2) {
        setRoutineA(data.routines[0]);
        setRoutineB(data.routines[1]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch first pair on mount
  useEffect(() => {
    fetchPair();
  }, [fetchPair]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const animateScore = useCallback((target: number) => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * target));
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const handleGuess = useCallback(
    async (guessHigher: boolean) => {
      if (!routineA || !routineB || revealed || loading) return;

      setLoading(true);
      // Capture current state before await
      const currentStreak = streakRef.current;
      const currentHighScore = highScoreRef.current;

      try {
        const res = await fetch("/api/games/similarity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idA: routineA.id, idB: routineB.id }),
        });
        const data = await res.json();
        const pct: number = data.percentage;

        setActualScore(pct);
        setRevealed(true);
        animateScore(pct);

        const isHigher = pct >= THRESHOLD;
        const correct = guessHigher === isHigher;

        // Delay result display until after animation
        setTimeout(() => {
          if (correct) {
            const newStreak = currentStreak + 1;
            setStreak(newStreak);
            setResult("correct");
            if (newStreak > currentHighScore) {
              setHighScore(newStreak);
              localStorage.setItem(LS_KEY, String(newStreak));
            }
          } else {
            setResult("wrong");
            setStreak(0);
          }
        }, ANIMATION_DURATION_MS);
      } finally {
        setLoading(false);
      }
    },
    [routineA, routineB, revealed, loading, animateScore]
  );

  const isGameOver = result === "wrong";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-ll-on-surface">
          Similarity Showdown
        </h2>
        <div className="flex items-center gap-4 text-sm font-medium text-ll-on-surface-muted">
          <span>
            Streak:{" "}
            <span className="text-ll-primary">{streak}</span>
          </span>
          <span>
            High Score:{" "}
            <span className="text-amber-600 dark:text-amber-400">
              {highScore}
            </span>
          </span>
        </div>
      </div>

      <p className="text-sm text-ll-on-surface-muted">
        Two LAPACK/BLAS routines appear below. Guess whether their cosine
        similarity is <strong>higher</strong> or <strong>lower</strong> than{" "}
        {THRESHOLD}%.
      </p>

      {/* Routine cards */}
      {routineA && routineB ? (
        <div className="flex flex-col md:flex-row gap-4">
          <RoutineCard routine={routineA} />
          <RoutineCard routine={routineB} />
        </div>
      ) : (
        <div className="flex items-center justify-center py-12 text-ll-on-surface-muted">
          Loading routines...
        </div>
      )}

      {/* Guess buttons or result */}
      {!revealed && routineA && routineB && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => handleGuess(true)}
            disabled={loading}
            className="rounded-lg bg-ll-primary px-6 py-2.5 text-sm font-semibold text-ll-on-primary shadow-sm hover:bg-ll-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Higher than {THRESHOLD}%?
          </button>
          <button
            onClick={() => handleGuess(false)}
            disabled={loading}
            className="rounded-lg bg-ll-surface-tonal px-6 py-2.5 text-sm font-semibold text-ll-on-surface shadow-sm hover:bg-ll-outline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Lower than {THRESHOLD}%?
          </button>
        </div>
      )}

      {/* Animated score reveal */}
      {revealed && (
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl font-bold font-mono text-ll-on-surface">
            {displayScore}%
          </div>

          {result === "correct" && (
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              Correct!
            </div>
          )}

          {result === "wrong" && (
            <div className="space-y-1 text-center">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                Wrong!
              </div>
              <div className="text-sm text-ll-on-surface-muted">
                Game Over! Streak: {streakRef.current} | High Score:{" "}
                {highScoreRef.current}
              </div>
            </div>
          )}

          {result && (
            <button
              onClick={fetchPair}
              className="mt-2 rounded-lg bg-ll-primary px-6 py-2.5 text-sm font-semibold text-ll-on-primary shadow-sm hover:bg-ll-primary-hover transition-colors"
            >
              Next Round
            </button>
          )}
        </div>
      )}
    </div>
  );
}
