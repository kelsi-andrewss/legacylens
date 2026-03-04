"use client";

import { useState, useRef, useCallback } from "react";
import {
  QUIZ_QUESTIONS,
  TRAIT_TO_ROUTINE,
  type Trait,
  type TraitResult,
} from "@/lib/gameData";
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

export default function PersonalityQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Trait[]>([]);
  const [result, setResult] = useState<TraitResult | null>(null);
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [copied, setCopied] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const streamExplanation = useCallback(async (routine: string) => {
    setIsLoading(true);
    setAnswer("");
    setChunks([]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `What does ${routine} do and how does it work?`,
          mode: "explain",
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
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
            // skip malformed JSON
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const computeResult = useCallback(
    (allAnswers: Trait[]) => {
      const counts: Record<Trait, number> = {
        solver: 0,
        decomposer: 0,
        multiplier: 0,
        optimizer: 0,
      };
      for (const t of allAnswers) {
        counts[t]++;
      }

      // Tie-break by order of first appearance in questions
      const traitOrder: Trait[] = [];
      for (const q of QUIZ_QUESTIONS) {
        for (const a of q.answers) {
          if (!traitOrder.includes(a.trait)) {
            traitOrder.push(a.trait);
          }
        }
      }

      let dominant: Trait = traitOrder[0];
      for (const t of traitOrder) {
        if (counts[t] > counts[dominant]) {
          dominant = t;
        }
      }

      const traitResult = TRAIT_TO_ROUTINE[dominant];
      setResult(traitResult);
      setShowResult(true);
      streamExplanation(traitResult.routine);
    },
    [streamExplanation]
  );

  const handleAnswer = useCallback(
    (trait: Trait) => {
      const nextAnswers = [...answers, trait];
      setAnswers(nextAnswers);

      if (nextAnswers.length >= QUIZ_QUESTIONS.length) {
        setFadeOut(true);
        setTimeout(() => {
          computeResult(nextAnswers);
          setFadeOut(false);
        }, 300);
      } else {
        setFadeOut(true);
        setTimeout(() => {
          setCurrentQuestion((prev) => prev + 1);
          setFadeOut(false);
        }, 300);
      }
    },
    [answers, computeResult]
  );

  const handleRetake = useCallback(() => {
    abortRef.current?.abort();
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
    setAnswer("");
    setChunks([]);
    setIsLoading(false);
    setShowResult(false);
    setFadeOut(false);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = `I'm ${result.routine} — ${result.tagline}!`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  if (!showResult) {
    const question = QUIZ_QUESTIONS[currentQuestion];
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-sm font-medium text-ll-on-surface-muted">
            Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
          </span>
          <div className="flex gap-1.5">
            {QUIZ_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                  i < answers.length
                    ? "bg-ll-primary"
                    : i === currentQuestion
                      ? "bg-ll-primary-muted"
                      : "bg-ll-surface-tonal"
                }`}
              />
            ))}
          </div>
        </div>

        <div
          className={`transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}
        >
          <h2 className="mb-8 text-xl font-semibold text-ll-on-surface">
            {question.question}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.answers.map((a, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(a.trait)}
                className="rounded-lg border border-ll-outline bg-ll-surface-variant px-4 py-4 text-left text-sm font-medium text-ll-on-surface shadow-sm transition-all hover:border-ll-primary hover:bg-ll-primary-container hover:text-ll-on-primary-container active:scale-[0.98]"
              >
                {a.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Result card */}
      <div className="rounded-xl border border-ll-outline bg-gradient-to-br from-ll-primary-container to-ll-surface-variant p-8 shadow-sm">
        <div className="mb-1 text-sm font-medium uppercase tracking-wider text-ll-primary">
          You are...
        </div>
        <h2 className="mb-2 font-mono text-3xl font-bold text-ll-on-surface">
          {result?.routine}
        </h2>
        <p className="mb-3 text-lg font-medium text-ll-primary">
          {result?.tagline}
        </p>
        <p className="text-ll-on-surface-muted">
          {result?.description}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCopy}
            className="rounded-lg border border-ll-outline bg-ll-surface-variant px-4 py-2 text-sm font-medium text-ll-on-surface transition-colors hover:bg-ll-surface-tonal"
          >
            {copied ? "Copied!" : "Copy Result"}
          </button>
          <button
            onClick={handleRetake}
            className="rounded-lg bg-ll-primary px-4 py-2 text-sm font-medium text-ll-on-primary transition-colors hover:bg-ll-primary-hover"
          >
            Retake Quiz
          </button>
        </div>
      </div>

      {/* Streamed explanation */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-ll-on-surface">
          About {result?.routine}
        </h3>
        <AnswerStream content={answer} isStreaming={isLoading} />
      </div>

      {/* Code snippets */}
      {chunks.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-ll-on-surface">
            Source Code
          </h3>
          <div className="space-y-4">
            {chunks.map((chunk) => (
              <CodeSnippet key={chunk.id} chunk={chunk} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
