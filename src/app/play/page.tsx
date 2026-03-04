"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Target, Brain, Link, Dices, Wand2 } from "lucide-react";

const GAMES: {
  id: "similarity" | "quiz" | "connections" | "roulette" | "spellbook";
  title: string;
  icon: ReactNode;
  description: string;
}[] = [
  {
    id: "similarity",
    title: "Similarity Showdown",
    icon: <Target className="w-5 h-5" />,
    description: "Guess if two LAPACK routines are more or less than 70% similar",
  },
  {
    id: "quiz",
    title: "What Routine Are You?",
    icon: <Brain className="w-5 h-5" />,
    description: "Take a personality quiz to find your LAPACK spirit routine",
  },
  {
    id: "connections",
    title: "LAPACK Connections",
    icon: <Link className="w-5 h-5" />,
    description: "Group 16 routines into 4 categories \u2014 NYT Connections style",
  },
  {
    id: "roulette",
    title: "Routine Roulette",
    icon: <Dices className="w-5 h-5" />,
    description: "Spin the wheel and discover a random LAPACK routine",
  },
  {
    id: "spellbook",
    title: "LAPACK Spellbook",
    icon: <Wand2 className="w-5 h-5" />,
    description: "Cast the right LAPACK spell to survive 15 fantasy encounters",
  },
];

type GameId = "similarity" | "quiz" | "connections" | "roulette" | "spellbook";

const gameComponents: Record<GameId, ReturnType<typeof dynamic>> = {
  similarity: dynamic(() => import("@/components/games/SimilarityShowdown"), {
    loading: () => <p className="text-ll-on-surface-muted">Loading...</p>,
  }),
  quiz: dynamic(() => import("@/components/games/PersonalityQuiz"), {
    loading: () => <p className="text-ll-on-surface-muted">Loading...</p>,
  }),
  connections: dynamic(() => import("@/components/games/ConnectionsGame"), {
    loading: () => <p className="text-ll-on-surface-muted">Loading...</p>,
  }),
  roulette: dynamic(() => import("@/components/games/RoutineRoulette"), {
    loading: () => <p className="text-ll-on-surface-muted">Loading...</p>,
  }),
  spellbook: dynamic(() => import("@/components/games/SpellbookGame"), {
    loading: () => <p className="text-ll-on-surface-muted">Loading...</p>,
  }),
};

export default function PlayPage() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  if (activeGame) {
    const GameComponent = gameComponents[activeGame];
    return (
      <div className="min-h-screen bg-ll-surface">
        <main className="mx-auto max-w-4xl px-4 py-8">
          <button
            onClick={() => setActiveGame(null)}
            className="mb-6 text-sm text-ll-on-surface-muted hover:text-ll-on-surface transition-colors"
          >
            &larr; Back to Games
          </button>
          <GameComponent />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ll-surface">
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ll-on-surface">
            Games
          </h1>
          <p className="mt-1 text-sm text-ll-on-surface-muted">
            Learn LAPACK the fun way
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className="rounded-lg border border-ll-outline bg-ll-surface-variant p-6 text-left hover:border-ll-primary transition-colors cursor-pointer"
            >
              <span className="text-ll-on-surface-muted">{game.icon}</span>
              <h2 className="mt-3 font-semibold text-ll-on-surface">
                {game.title}
              </h2>
              <p className="mt-1 text-sm text-ll-on-surface-muted">
                {game.description}
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-ll-primary">
                Play &rarr;
              </span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
