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
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
          </span>
          <div className="flex gap-1.5">
            {QUIZ_QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors duration-300 ${
                  i < answers.length
                    ? "bg-blue-500"
                    : i === currentQuestion
                      ? "bg-blue-300 dark:bg-blue-700"
                      : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>

        <div
          className={`transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}
        >
          <h2 className="mb-8 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {question.question}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.answers.map((a, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(a.trait)}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-4 text-left text-sm font-medium text-zinc-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:scale-[0.98] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
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
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm dark:border-zinc-700 dark:from-blue-950/20 dark:to-zinc-900">
        <div className="mb-1 text-sm font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
          You are...
        </div>
        <h2 className="mb-2 font-mono text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          {result?.routine}
        </h2>
        <p className="mb-3 text-lg font-medium text-blue-600 dark:text-blue-400">
          {result?.tagline}
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          {result?.description}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleCopy}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {copied ? "Copied!" : "Copy Result"}
          </button>
          <button
            onClick={handleRetake}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Retake Quiz
          </button>
        </div>
      </div>

      {/* Streamed explanation */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          About {result?.routine}
        </h3>
        <AnswerStream content={answer} isStreaming={isLoading} />
      </div>

      {/* Code snippets */}
      {chunks.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
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
