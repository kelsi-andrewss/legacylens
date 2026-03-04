"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SPELLBOOK_ENCOUNTERS, type SpellbookEncounter } from "@/lib/gameData";

type Phase = "question" | "result" | "summary";

interface SelectionState {
  chosenRoutineId: string;
  isCorrect: boolean;
}

function getWizardTitle(score: number, total: number): string {
  const pct = total > 0 ? score / total : 0;
  if (pct > 0.7) return "Grand Wizard of the Matrix";
  if (pct >= 0.4) return "Apprentice Arithmetician";
  return "Novice Neophyte";
}

export default function SpellbookGame() {
  const [encounterIndex, setEncounterIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase === "result") {
      requestAnimationFrame(() => continueRef.current?.focus());
    }
  }, [phase]);

  const handleSpellSelect = useCallback(
    (optionId: string, routineId: string, encounter: SpellbookEncounter) => {
      if (phase !== "question") return;
      const isCorrect = routineId === encounter.correctRoutineId;
      setAnimatingId(optionId);
      setSelection({ chosenRoutineId: routineId, isCorrect });

      if (isCorrect) {
        setScore((prev) => prev + 1);
      }

      animTimerRef.current = setTimeout(() => {
        setAnimatingId(null);
        setPhase("result");
      }, 600);
    },
    [phase]
  );

  const handleContinue = useCallback(() => {
    const nextIndex = encounterIndex + 1;
    if (nextIndex >= SPELLBOOK_ENCOUNTERS.length) {
      setPhase("summary");
    } else {
      setEncounterIndex(nextIndex);
      setSelection(null);
      setAnimatingId(null);
      setPhase("question");
    }
  }, [encounterIndex]);

  const handleRestart = useCallback(() => {
    setEncounterIndex(0);
    setScore(0);
    setPhase("question");
    setSelection(null);
    setAnimatingId(null);
  }, []);

  if (phase === "summary") {
    const total = SPELLBOOK_ENCOUNTERS.length;
    const pct = Math.round((score / total) * 100);
    const title = getWizardTitle(score, total);
    return (
      <div className="mx-auto w-full max-w-2xl px-2 sm:px-0">
        <style jsx>{`
          @keyframes glow-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .glow-in {
            animation: glow-in 400ms ease-out forwards;
          }
        `}</style>
        <div className="glow-in rounded-xl border border-ll-outline bg-gradient-to-br from-ll-primary-container to-ll-surface-variant p-8 text-center shadow-sm">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-ll-primary">
            Quest Complete
          </p>
          <h2 className="mb-1 text-3xl font-bold text-ll-on-surface">{title}</h2>
          <p className="mb-6 text-ll-on-surface-muted">
            You cast {score} of {total} spells correctly — {pct}%
          </p>
          <div className="mx-auto mb-6 flex w-full max-w-xs gap-1.5">
            {SPELLBOOK_ENCOUNTERS.map((_, i) => (
              <div
                key={i}
                className="h-2 flex-1 rounded-full bg-ll-primary"
                style={{ opacity: i < score ? 1 : 0.2 }}
              />
            ))}
          </div>
          <button
            onClick={handleRestart}
            className="rounded-lg bg-ll-primary px-6 py-2.5 text-sm font-medium text-ll-on-primary transition-colors hover:bg-ll-primary-hover"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  const encounter = SPELLBOOK_ENCOUNTERS[encounterIndex];

  return (
    <div className="mx-auto w-full max-w-2xl px-2 sm:px-0">
      <style jsx>{`
        @keyframes correct-glow {
          0% {
            box-shadow: 0 0 0 0 rgba(var(--ll-primary-rgb, 99, 102, 241), 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(var(--ll-primary-rgb, 99, 102, 241), 0.15);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(var(--ll-primary-rgb, 99, 102, 241), 0);
          }
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        .animate-correct {
          animation: correct-glow 600ms ease-out forwards;
        }
        .animate-wrong {
          animation: shake 600ms ease-in-out forwards;
        }
      `}</style>

      {/* Progress header */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm font-medium text-ll-on-surface-muted">
          Encounter {encounterIndex + 1} of {SPELLBOOK_ENCOUNTERS.length}
        </span>
        <div className="flex gap-1 sm:gap-1.5">
          {SPELLBOOK_ENCOUNTERS.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-4 sm:w-6 rounded-full transition-colors duration-300 ${
                i < encounterIndex
                  ? "bg-ll-primary"
                  : i === encounterIndex
                  ? "bg-ll-primary-muted"
                  : "bg-ll-surface-tonal"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-ll-on-surface-muted">
          Score: {score}
        </span>
      </div>

      {/* Scenario card */}
      <div className="mb-6 rounded-xl border border-ll-outline bg-ll-surface-variant p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wider text-ll-primary mb-2">
          Encounter {encounterIndex + 1}
        </p>
        <p className="text-ll-on-surface leading-relaxed">{encounter.scenario}</p>
      </div>

      {/* Spell options */}
      {phase === "question" && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {encounter.spellOptions.map((option) => {
            const isAnimating = animatingId === option.id;
            const isCorrectOption = option.routineId === encounter.correctRoutineId;
            let animClass = "";
            if (isAnimating) {
              animClass = isCorrectOption ? "animate-correct" : "animate-wrong";
            }
            return (
              <button
                key={option.id}
                onClick={() =>
                  handleSpellSelect(option.id, option.routineId, encounter)
                }
                disabled={animatingId !== null}
                aria-label={`Cast ${option.spellName} (${option.routineId})`}
                className={`rounded-lg border border-ll-outline bg-ll-surface-variant px-4 py-4 text-left transition-all hover:border-ll-primary hover:bg-ll-primary-container hover:text-ll-on-primary-container active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${animClass}`}
              >
                <p className="font-semibold text-ll-on-surface text-sm">
                  {option.spellName}
                </p>
                <p className="mt-0.5 font-mono text-xs text-ll-primary">
                  {option.routineId}
                </p>
                <p className="mt-2 text-xs text-ll-on-surface-muted leading-relaxed">
                  {option.flavorText}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Outcome display */}
      {phase === "result" && selection && (
        <div
          className={`rounded-xl border p-5 shadow-sm ${
            selection.isCorrect
              ? "border-green-600 bg-green-950/30"
              : "border-red-600 bg-red-950/30"
          }`}
          aria-live="polite"
        >
          <p
            className={`mb-2 font-semibold ${
              selection.isCorrect ? "text-green-400" : "text-red-400"
            }`}
          >
            {selection.isCorrect ? "Spell Cast Correctly!" : "Wrong Incantation!"}
          </p>
          <p className="text-sm text-ll-on-surface leading-relaxed">
            {selection.isCorrect
              ? encounter.outcomeCorrect
              : encounter.outcomeWrong}
          </p>
          {!selection.isCorrect && (
            <p className="mt-3 text-xs text-ll-on-surface-muted">
              The correct spell was{" "}
              <span className="font-mono font-semibold text-ll-primary">
                {encounter.correctRoutineId}
              </span>
              .
            </p>
          )}
          <button
            ref={continueRef}
            onClick={handleContinue}
            className="mt-4 rounded-lg bg-ll-primary px-5 py-2 text-sm font-medium text-ll-on-primary transition-colors hover:bg-ll-primary-hover"
          >
            {encounterIndex + 1 >= SPELLBOOK_ENCOUNTERS.length
              ? "See Results"
              : "Next Encounter"}
          </button>
        </div>
      )}
    </div>
  );
}
