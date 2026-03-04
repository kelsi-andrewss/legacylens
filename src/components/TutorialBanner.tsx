import type { QueryMode } from "@/lib/prompts";

export interface TourStep {
  mode: QueryMode;
  query: string | null; // null = commentary-only, keep previous result visible
  title: string;
  commentary: string;
  highlight?: "search" | "mode" | "chunks" | "sidebar" | "answer";
  filters?: { category?: string; dataType?: string };
}

export const TOUR_STEPS: TourStep[] = [
  {
    mode: "explain",
    query: "What does DGESV do?",
    title: "Ask in Plain English",
    commentary:
      "DGESV is LAPACK's core linear solver. Ask any question in natural language — LegacyLens searches 7,759 code vectors across 2,329 Fortran files and returns the most relevant routines.",
    highlight: "search",
    filters: {},
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
    title: "Dependency Mapping",
    commentary:
      "Switch to Dependencies mode — the same natural-language question now maps the call graph. DGETRF (LU factorization) chains into DTRSM, DLASWP, and DGEMM. Every subroutine, every edge.",
    highlight: "mode",
    filters: {},
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
      "The sidebar narrows results by library (LAPACK or BLAS) and numeric precision (single, double, complex, double complex). BLAS is now selected — it applies to the next query. Press Next when ready.",
    highlight: "sidebar",
    filters: { category: "BLAS" },
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
