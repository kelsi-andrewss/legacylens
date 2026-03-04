import type { QueryMode } from "@/lib/prompts";

export interface TourStep {
  mode: QueryMode;
  query: string | null;
  title: string;
  commentary: string;
  highlight?: "search" | "mode" | "chunks" | "sidebar" | "answer";
  filters?: { category?: string; dataType?: string };
  waitFor?: "search" | "mode" | "filter";
}

export const TOUR_STEPS: TourStep[] = [
  {
    mode: "explain",
    query: "What does DGESV do?",
    title: "Ask in Plain English",
    commentary:
      "The search bar is pre-filled — press Search to run it, or edit the question first. This searches 7,759 Fortran code vectors across 2,329 files.",
    highlight: "search",
    filters: {},
    waitFor: "search",
  },
  {
    mode: "explain",
    query: null,
    title: "Retrieved Source Code",
    commentary:
      "These cards are the actual Fortran subroutines LegacyLens retrieved. Each shows the routine name, LAPACK/BLAS category, relevance match %, and a direct link to the source on GitHub. Press Next when ready.",
    highlight: "chunks",
  },
  {
    mode: "dependencies",
    query: "What does DGETRF call?",
    title: "Switch Modes",
    commentary:
      "Each mode asks a different question about the same code. Click Dependencies above to map what DGETRF calls.",
    highlight: "mode",
    filters: {},
    waitFor: "mode",
  },
  {
    mode: "docs",
    query: "Generate documentation for DPOTRF",
    title: "Documentation Gen",
    commentary:
      "Documentation mode generates structured docs for any routine — name, purpose, parameters, return values, side effects. Ideal for code that was never properly documented.",
    highlight: "answer",
    filters: {},
  },
  {
    mode: "translate",
    query: "How would I write DGEMM in Python?",
    title: "Modern Equivalents",
    commentary:
      "Translation mode maps Fortran routines to NumPy/SciPy equivalents, with notes on behavioral differences — like column-major vs row-major layout that causes subtle bugs in ported code.",
    highlight: "answer",
    filters: {},
  },
  {
    mode: "translate",
    query: null,
    title: "Filter by Library",
    commentary:
      "The sidebar narrows results by library and precision. Click BLAS to filter — the next query will only return BLAS routines.",
    highlight: "sidebar",
    filters: { category: "BLAS" },
    waitFor: "filter",
  },
  {
    mode: "explain",
    query: "What are BLAS matrix-vector operations?",
    title: "Filtered Search",
    commentary:
      "Filtering to BLAS only — every retrieved chunk is a BLAS routine. Combine library and precision filters with any question to zero in on exactly the code you need.",
    highlight: "chunks",
  },
  {
    mode: "explain",
    query: "Show me error handling patterns in LAPACK",
    title: "Cross-cutting Search",
    commentary:
      "LegacyLens isn't limited to single routines. Cross-cutting queries find patterns across the entire codebase — error conventions, argument validation, return code standards.",
    highlight: "answer",
    filters: { category: "" },
  },
];

export interface TutorialBannerProps {
  step: number;
  onNext: () => void;
  onExit: () => void;
}

type CardPos = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  arrow: "left" | "right" | "top" | "bottom";
};

const CARD_POSITIONS: Record<string, CardPos> = {
  search:  { top: 148, right: 24, arrow: "left"  },
  mode:    { top: 218, right: 24, arrow: "left"  },
  chunks:  { bottom: 32, right: 24, arrow: "top" },
  answer:  { bottom: 32, right: 24, arrow: "top" },
  sidebar: { top: 200, left: 212, arrow: "left"  },
};
const DEFAULT_POS: CardPos = { bottom: 32, right: 24, arrow: "top" };

export default function TourCard({ step, onNext, onExit }: TutorialBannerProps) {
  const total = TOUR_STEPS.length;
  const current = TOUR_STEPS[step];
  const isLast = step === total - 1;

  const { arrow, ...posStyle } = CARD_POSITIONS[current.highlight ?? ""] ?? DEFAULT_POS;

  return (
    <div
      style={{ position: "fixed", zIndex: 50, ...posStyle }}
      className="w-72 overflow-visible rounded-xl bg-white shadow-xl ring-1 ring-black/5 transition-all duration-300 dark:bg-zinc-900 dark:ring-white/10"
    >
      {/* Arrow */}
      {arrow === "left" && (
        <div className="absolute -left-2 top-6 h-0 w-0 border-y-8 border-y-transparent border-r-8 border-r-white dark:border-r-zinc-900" />
      )}
      {arrow === "top" && (
        <div className="absolute -top-2 right-6 h-0 w-0 border-x-8 border-x-transparent border-b-8 border-b-white dark:border-b-zinc-900" />
      )}

      {/* Header: step counter + dots + close */}
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Step {step + 1} of {total}
          </span>
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === step ? "bg-blue-600" : "bg-blue-200 dark:bg-blue-800"
                }`}
              />
            ))}
          </div>
        </div>
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
      <div className="flex justify-end border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
        {isLast ? (
          <button
            onClick={onNext}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Finish
          </button>
        ) : (
          <button
            onClick={onNext}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {current.waitFor ? "Skip →" : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
}
