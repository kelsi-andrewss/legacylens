"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Challenge } from "@/lib/challenges";

const AUTO_DISMISS_MS = 15_000;
const RESULT_DISPLAY_MS = 2_000;
const PARTIAL_XP = 5;

interface ChallengeToastProps {
  challenge: Challenge;
  onComplete: (xpReward: number) => void;
}

export default function ChallengeToast({ challenge, onComplete }: ChallengeToastProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<"asking" | "correct" | "wrong" | "exiting">("asking");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const challengeRef = useRef(challenge);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    challengeRef.current = challenge;
  }, [onComplete, challenge]);

  // Animate in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const dismiss = useCallback((xp: number) => {
    setPhase("exiting");
    setVisible(false);
    const timeout = setTimeout(() => {
      onCompleteRef.current(xp);
    }, 300); // match CSS exit transition
    timerRef.current = timeout;
  }, []);

  // Auto-dismiss after 15 seconds of no interaction
  useEffect(() => {
    if (phase !== "asking") return;

    const timeout = setTimeout(() => {
      dismiss(PARTIAL_XP);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timeout);
  }, [phase, dismiss]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelect = useCallback((index: number) => {
    if (phase !== "asking") return;

    setSelectedIndex(index);
    const isCorrect = index === challengeRef.current.correctIndex;

    if (isCorrect) {
      setPhase("correct");
      setTimeout(() => dismiss(challengeRef.current.xpReward), RESULT_DISPLAY_MS);
    } else {
      setPhase("wrong");
      setTimeout(() => dismiss(PARTIAL_XP), RESULT_DISPLAY_MS);
    }
  }, [phase, dismiss]);

  const xpDisplay = phase === "correct" ? `+${challenge.xpReward}` : phase === "wrong" ? `+${PARTIAL_XP}` : null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[var(--z-toast)] w-80 rounded-xl border border-ll-outline bg-ll-surface-variant shadow-2xl transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ll-outline px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-ll-primary">
          Challenge
        </span>
        {phase === "asking" && (
          <button
            onClick={() => dismiss(PARTIAL_XP)}
            className="text-xs text-ll-on-surface-muted hover:text-ll-on-surface"
            aria-label="Dismiss challenge"
          >
            Skip
          </button>
        )}
      </div>

      {/* Question */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-sm font-medium text-ll-on-surface">{challenge.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-1.5 px-4 pb-3">
        {challenge.options.map((option, i) => {
          let btnClass = "border border-ll-outline bg-ll-surface text-ll-on-surface hover:bg-ll-surface-tonal";

          if (selectedIndex !== null) {
            if (i === challenge.correctIndex) {
              btnClass = "border border-green-500 bg-green-500/15 text-green-700 dark:text-green-300";
            } else if (i === selectedIndex && phase === "wrong") {
              btnClass = "border border-red-500 bg-red-500/15 text-red-700 dark:text-red-300";
            } else {
              btnClass = "border border-ll-outline bg-ll-surface text-ll-on-surface-muted opacity-50";
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={phase !== "asking"}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${btnClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* XP reward animation */}
      {xpDisplay && (
        <div className="flex items-center justify-center pb-3">
          <span
            className={`animate-bounce text-sm font-bold ${
              phase === "correct" ? "text-green-500" : "text-amber-500"
            }`}
          >
            {xpDisplay} XP
          </span>
        </div>
      )}
    </div>
  );
}
