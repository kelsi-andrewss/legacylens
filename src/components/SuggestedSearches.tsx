"use client";

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
    <div className="flex flex-wrap gap-2">
      {SUGGESTED_QUERIES.map((query) => (
        <button
          key={query}
          type="button"
          onClick={() => onSelect(query)}
          style={{
            border: "1px solid var(--color-primary)",
            color: "var(--color-primary)",
            background: "var(--color-surface)",
          }}
          className="rounded-full px-3 py-1 text-sm cursor-pointer transition-opacity hover:opacity-75"
        >
          {query}
        </button>
      ))}
    </div>
  );
}
