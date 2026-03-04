"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CONNECTIONS_PUZZLES,
  ConnectionsCategory,
  ConnectionsPuzzle,
  Difficulty,
} from "@/lib/gameData";

const STORAGE_KEY = "connections-completed";
const MAX_MISTAKES = 4;

const difficultyColors: Record<Difficulty, string> = {
  yellow: "bg-yellow-400 text-yellow-900",
  green: "bg-green-500 text-white",
  blue: "bg-blue-500 text-white",
  purple: "bg-purple-600 text-white",
};

const difficultyOrder: Difficulty[] = ["yellow", "green", "blue", "purple"];

function getCompletedIds(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markCompleted(id: number) {
  const ids = getCompletedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickPuzzle(): ConnectionsPuzzle | null {
  const completed = getCompletedIds();
  const available = CONNECTIONS_PUZZLES.filter(
    (p) => !completed.includes(p.id)
  );
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

export default function ConnectionsGame() {
  const [puzzle, setPuzzle] = useState<ConnectionsPuzzle | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [found, setFound] = useState<ConnectionsCategory[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [shuffledNames, setShuffledNames] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [allCompleted, setAllCompleted] = useState(false);

  const shakingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initPuzzle = useCallback(() => {
    const p = pickPuzzle();
    if (!p) {
      setAllCompleted(true);
      return;
    }
    setAllCompleted(false);
    setPuzzle(p);
    setSelected(new Set());
    setFound([]);
    setMistakes(0);
    setGameOver(false);
    setWon(false);
    setShaking(false);
    const names = p.categories.flatMap((c) => c.routines);
    setShuffledNames(shuffle(names));
  }, []);

  useEffect(() => {
    initPuzzle();
    return () => {
      if (shakingTimerRef.current) clearTimeout(shakingTimerRef.current);
    };
  }, [initPuzzle]);

  const toggleSelect = useCallback(
    (name: string) => {
      if (gameOver) return;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(name)) {
          next.delete(name);
        } else if (next.size < 4) {
          next.add(name);
        }
        return next;
      });
    },
    [gameOver]
  );

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const handleSubmit = useCallback(() => {
    if (!puzzle || selected.size !== 4 || gameOver) return;

    const selectedArr = Array.from(selected);
    const unsolvedCategories = puzzle.categories.filter(
      (c) => !found.some((f) => f.label === c.label)
    );

    const match = unsolvedCategories.find((cat) => {
      const catSet = new Set(cat.routines);
      return (
        selectedArr.length === catSet.size &&
        selectedArr.every((r) => catSet.has(r))
      );
    });

    if (match) {
      const nextFound = [...found, match];
      setFound(nextFound);
      setSelected(new Set());

      if (nextFound.length === puzzle.categories.length) {
        setWon(true);
        setGameOver(true);
        markCompleted(puzzle.id);
      }
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setShaking(true);
      shakingTimerRef.current = setTimeout(() => {
        setShaking(false);
        setSelected(new Set());
      }, 300);

      if (nextMistakes >= MAX_MISTAKES) {
        setGameOver(true);
        // Reveal remaining categories
        const remaining = unsolvedCategories;
        setFound([...found, ...remaining]);
        markCompleted(puzzle.id);
      }
    }
  }, [puzzle, selected, found, mistakes, gameOver]);

  if (allCompleted) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <h2 className="text-xl font-bold">All puzzles completed!</h2>
        <p className="text-ll-on-surface-muted">
          You've solved every LAPACK Connections puzzle. Check back later for
          more.
        </p>
      </div>
    );
  }

  if (!puzzle) return null;

  const foundNames = new Set(found.flatMap((c) => c.routines));
  const remainingNames = shuffledNames.filter((n) => !foundNames.has(n));

  const sortedFound = [...found].sort(
    (a, b) =>
      difficultyOrder.indexOf(a.difficulty) -
      difficultyOrder.indexOf(b.difficulty)
  );

  const mistakeDots = Array.from(
    { length: MAX_MISTAKES - mistakes },
    (_, i) => i
  );

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <style jsx>{`
        @keyframes shake {
          0% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-4px);
          }
          40% {
            transform: translateX(4px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
          100% {
            transform: translateX(0);
          }
        }
        .shake-animation {
          animation: shake 300ms ease-in-out;
        }
      `}</style>

      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">LAPACK Connections</h2>
        <p className="text-sm text-ll-on-surface-muted">
          Group the 16 routines into 4 categories of 4
        </p>
      </div>

      {!gameOver && (
        <div className="flex items-center gap-1.5 text-sm text-ll-on-surface-muted">
          <span>Mistakes remaining:</span>
          {mistakeDots.map((i) => (
            <span
              key={i}
              className="inline-block w-2.5 h-2.5 rounded-full bg-ll-on-surface"
            />
          ))}
        </div>
      )}

      {/* Solved categories */}
      <div className="flex flex-col gap-2 w-full">
        {sortedFound.map((cat) => (
          <div
            key={cat.label}
            className={`${difficultyColors[cat.difficulty]} rounded-lg px-4 py-3 text-center`}
          >
            <div className="font-bold text-sm uppercase tracking-wide">
              {cat.label}
            </div>
            <div className="text-xs font-mono mt-1">
              {cat.routines.join(", ")}
            </div>
          </div>
        ))}
      </div>

      {/* Remaining tiles */}
      {remainingNames.length > 0 && (
        <div
          className={`grid grid-cols-4 gap-2 w-full ${shaking ? "shake-animation" : ""}`}
        >
          {remainingNames.map((name) => {
            const isSelected = selected.has(name);
            return (
              <button
                key={name}
                onClick={() => toggleSelect(name)}
                disabled={gameOver}
                className={`rounded-md px-2 py-3 text-xs font-mono font-bold transition-colors
                  ${
                    isSelected
                      ? "ring-2 ring-ll-primary bg-ll-primary-container text-ll-on-primary-container"
                      : "bg-ll-surface-tonal text-ll-on-surface hover:bg-ll-outline"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      {/* Controls */}
      {!gameOver && (
        <div className="flex gap-3">
          <button
            onClick={deselectAll}
            disabled={selected.size === 0}
            className="px-4 py-2 text-sm rounded-md border border-ll-outline text-ll-on-surface hover:bg-ll-surface-tonal disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Deselect All
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.size !== 4}
            className="px-4 py-2 text-sm rounded-md bg-ll-on-surface text-ll-surface font-medium hover:bg-ll-on-surface/80 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      )}

      {/* Win/Loss message */}
      {gameOver && (
        <div className="text-center">
          <p className="text-lg font-semibold mb-3">
            {won ? "Congratulations!" : "Better luck next time"}
          </p>
          <button
            onClick={initPuzzle}
            className="px-4 py-2 text-sm rounded-md bg-ll-on-surface text-ll-surface font-medium hover:bg-ll-on-surface/80"
          >
            New Puzzle
          </button>
        </div>
      )}
    </div>
  );
}
