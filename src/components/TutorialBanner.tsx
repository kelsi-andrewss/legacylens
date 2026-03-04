export interface TourStep {
  mode: string;
  query: string;
  title: string;
  commentary: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    mode: "explain",
    query: "What does DGESV do?",
    title: "Basic Explanation",
    commentary:
      "DGESV is LAPACK's workhorse linear solver. Ask anything in plain English — LegacyLens retrieves the relevant subroutines and explains them.",
  },
  {
    mode: "dependencies",
    query: "What does DGETRF call?",
    title: "Dependency Mapping",
    commentary:
      "Dependency mode maps the call graph. DGETRF (LU factorization) chains into BLAS routines — see exactly what calls what.",
  },
  {
    mode: "docs",
    query: "Generate documentation for DAXPY",
    title: "Documentation Gen",
    commentary:
      "Documentation mode produces structured docs for any routine — useful for undocumented or poorly-commented code.",
  },
  {
    mode: "translate",
    query: "How would I write DGEMM in Python?",
    title: "Translation Hints",
    commentary:
      "Translation mode suggests modern NumPy/SciPy equivalents with behavioral notes (column-major vs row-major, etc.).",
  },
  {
    mode: "explain",
    query: "Show me error handling patterns in LAPACK",
    title: "Cross-cutting Search",
    commentary:
      "Cross-cutting query — LegacyLens finds patterns across the entire codebase, not just single routines.",
  },
];

export interface TutorialBannerProps {
  step: number;
  onNext: () => void;
  onExit: () => void;
}

export default function TutorialBanner({ step, onNext, onExit }: TutorialBannerProps) {
  const total = TOUR_STEPS.length;
  const current = TOUR_STEPS[step];
  const isLast = step === total - 1;

  return (
    <div className="border-b border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex flex-row items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Step {step + 1} of {total} — {current.title}
            </span>
            <span className="inline-flex items-center rounded bg-blue-200 px-1.5 py-0.5 text-xs font-mono text-blue-800 dark:bg-blue-800 dark:text-blue-200">
              [{step + 1}/{total}]
            </span>
          </div>
          <p className="text-sm text-blue-800 dark:text-blue-200">{current.commentary}</p>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {isLast ? (
            <button
              onClick={onNext}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={onNext}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Next →
            </button>
          )}
          <button
            onClick={onExit}
            className="rounded px-2 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-900"
            aria-label="Exit tutorial"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
