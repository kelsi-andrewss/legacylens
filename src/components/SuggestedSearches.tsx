"use client";

import { Sparkles } from "lucide-react";

const SUGGESTED_QUERIES = [
  "Where is the main entry point of this program?",
  "What functions modify the CUSTOMER-RECORD?",
  "Explain what the CALCULATE-INTEREST paragraph does",
  "Find all file I/O operations",
  "What are the dependencies of MODULE-X?",
  "Show me error handling patterns in this codebase",
];

interface SuggestedSearchesProps {
  onSelect: (query: string) => void;
}

export default function SuggestedSearches({ onSelect }: SuggestedSearchesProps) {
  return (
    <div className="reveal-enter">
      <p className="text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted mb-3">Try an example:</p>
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((query) => (
          <button
            key={query}
            type="button"
            onClick={() => onSelect(query)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs border border-ll-primary/30 bg-ll-surface-tonal/50 text-ll-primary cursor-pointer transition-all duration-200 hover:border-ll-primary hover:bg-ll-primary/10 hover:shadow-[0_0_12px_rgba(0,212,255,0.3)] hover:-translate-y-0.5"
          >
            <Sparkles size={12} className="shrink-0" />
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
