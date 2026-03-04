"use client";

import { Sparkles } from "lucide-react";
import { useMemo } from "react";

const DEFAULT_QUERIES = [
  { query: "What does DGESV do?", mode: "explain" },
  { query: "What routines does DGESV call?", mode: "dependencies" },
  { query: "Translate DGEMM to Python", mode: "translate" },
  { query: "Document the DGETRF subroutine", mode: "docs" },
  { query: "Find all routines that modify array A", mode: "explain" },
  { query: "What does DPOTRF do?", mode: "explain" },
];

const FOLLOW_UP_TEMPLATES: { label: (r: string) => string; mode: string }[] = [
  { label: (r: string) => `What calls ${r}?`, mode: "dependencies" },
  { label: (r: string) => `Translate ${r} to Python`, mode: "translate" },
  { label: (r: string) => `Document ${r}`, mode: "docs" },
  { label: (r: string) => `Explain ${r}`, mode: "explain" },
  { label: (r: string) => `What does ${r} depend on?`, mode: "dependencies" },
];

interface SuggestedSearchesProps {
  onSelect: (query: string, mode?: string) => void;
  routineNames?: string[];
  currentMode?: string;
}

export default function SuggestedSearches({ onSelect, routineNames, currentMode }: SuggestedSearchesProps) {
  const chips = useMemo(() => {
    const hasRoutines = routineNames && routineNames.length > 0;

    if (!hasRoutines) {
      return { label: "Try an example:", items: DEFAULT_QUERIES };
    }

    const topRoutines = routineNames.slice(0, 2);

    const generated: { query: string; mode: string }[] = [];
    for (const routine of topRoutines) {
      for (const template of FOLLOW_UP_TEMPLATES) {
        generated.push({ query: template.label(routine), mode: template.mode });
      }
    }

    // Sort: modes different from currentMode come first
    const sorted = [...generated].sort((a, b) => {
      const aDiffers = a.mode !== currentMode ? 0 : 1;
      const bDiffers = b.mode !== currentMode ? 0 : 1;
      return aDiffers - bDiffers;
    });

    return { label: "Based on your search:", items: sorted.slice(0, 6) };
  }, [routineNames, currentMode]);

  return (
    <div className="reveal-enter">
      <p className="text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted mb-3">{chips.label}</p>
      <div className="flex flex-wrap gap-2">
        {chips.items.map((item) => (
          <button
            key={`${item.query}-${item.mode}`}
            type="button"
            onClick={() => onSelect(item.query, item.mode)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border border-ll-primary/30 bg-ll-surface-tonal/50 text-ll-primary cursor-pointer transition-all duration-200 hover:border-ll-primary hover:bg-ll-primary/10 hover:shadow-[0_0_12px_rgba(0,212,255,0.3)] hover:-translate-y-0.5"
          >
            <Sparkles size={12} className="shrink-0" />
            {item.query}
          </button>
        ))}
      </div>
    </div>
  );
}
