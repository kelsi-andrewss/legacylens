import type { QueryMode } from "@/lib/prompts";

export interface TourStep {
  mode: QueryMode;
  query: string | null;
  title: string;
  commentary: string;
  highlight?: "search" | "chunks" | "answer";
  filters?: { category?: string; dataType?: string };
  waitFor?: "search";
}

export const TOUR_STEPS: TourStep[] = [
  {
    mode: "explain",
    query: "What does DGESV do?",
    title: "Ask a question",
    commentary: "The bar is pre-filled — press Search to run it, or type your own question first.",
    highlight: "search",
    filters: {},
    waitFor: "search",
  },
  {
    mode: "explain",
    query: null,
    title: "Retrieved source code",
    commentary: "These are the actual Fortran routines LegacyLens found — ranked by relevance, with links to the source on GitHub.",
    highlight: "chunks",
  },
  {
    mode: "explain",
    query: null,
    title: "Grounded answer",
    commentary: "The response is synthesized from those specific routines — not generic knowledge about Fortran. That's the difference.",
    highlight: "answer",
  },
];

export interface TutorialBannerProps {
  step: number;
  onNext: () => void;
  onExit: () => void;
}

export default function TourCard({ step, onNext, onExit }: TutorialBannerProps) {
  const total = TOUR_STEPS.length;
  const current = TOUR_STEPS[step];
  const isLast = step === total - 1;

  return (
    <div
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 60 }}
      className="w-72 rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          Step {step + 1} of {total}
        </span>
        <button
          onClick={onExit}
          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Exit tutorial"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-4">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {current.title}
        </h3>
        <div className="flex items-start gap-2">
          {current.waitFor && (
            <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white dark:bg-blue-500">
              Your turn
            </span>
          )}
          <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            {current.commentary}
          </p>
        </div>
      </div>

      {/* Footer */}
      {!current.waitFor && (
        <div className="flex justify-end border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <button
            onClick={onNext}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isLast ? "Done" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}
