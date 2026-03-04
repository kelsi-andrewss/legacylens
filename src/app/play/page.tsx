"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const GAMES = [
  {
    id: "similarity" as const,
    title: "Similarity Showdown",
    icon: "\uD83C\uDFAF",
    description: "Guess if two LAPACK routines are more or less than 70% similar",
  },
  {
    id: "quiz" as const,
    title: "What Routine Are You?",
    icon: "\uD83E\uDDE0",
    description: "Take a personality quiz to find your LAPACK spirit routine",
  },
  {
    id: "connections" as const,
    title: "LAPACK Connections",
    icon: "\uD83D\uDD17",
    description: "Group 16 routines into 4 categories \u2014 NYT Connections style",
  },
  {
    id: "roulette" as const,
    title: "Routine Roulette",
    icon: "\uD83C\uDFB0",
    description: "Spin the wheel and discover a random LAPACK routine",
  },
];

type GameId = (typeof GAMES)[number]["id"];

const gameComponents: Record<GameId, ReturnType<typeof dynamic>> = {
  similarity: dynamic(() => import("@/components/games/SimilarityShowdown"), {
    loading: () => <p className="text-zinc-500">Loading...</p>,
  }),
  quiz: dynamic(() => import("@/components/games/PersonalityQuiz"), {
    loading: () => <p className="text-zinc-500">Loading...</p>,
  }),
  connections: dynamic(() => import("@/components/games/ConnectionsGame"), {
    loading: () => <p className="text-zinc-500">Loading...</p>,
  }),
  roulette: dynamic(() => import("@/components/games/RoutineRoulette"), {
    loading: () => <p className="text-zinc-500">Loading...</p>,
  }),
};

export default function PlayPage() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  if (activeGame) {
    const GameComponent = gameComponents[activeGame];
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <button
            onClick={() => setActiveGame(null)}
            className="mb-6 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            &larr; Back to Games
          </button>
          <GameComponent />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Games
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Learn LAPACK the fun way
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className="rounded-lg border border-zinc-200 bg-white p-6 text-left dark:border-zinc-800 dark:bg-zinc-900 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
            >
              <span className="text-3xl">{game.icon}</span>
              <h2 className="mt-3 font-semibold text-zinc-900 dark:text-zinc-100">
                {game.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {game.description}
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-blue-600 dark:text-blue-400">
                Play &rarr;
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
