"use client";

import { useState, FormEvent, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  externalQuery?: string;
}

export default function SearchBar({ onSearch, isLoading, externalQuery }: SearchBarProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (externalQuery !== undefined) {
      setQuery(externalQuery);
    }
  }, [externalQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="theme-search relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about LAPACK code... e.g., 'What does DGESV do?'"
          className="w-full rounded-lg border border-ll-outline bg-ll-surface-variant px-4 py-3 pr-24 text-ll-on-surface placeholder-ll-on-surface-muted shadow-sm focus:border-ll-primary focus:outline-none focus:ring-2 focus:ring-ll-primary-faint"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-ll-primary px-4 py-1.5 text-sm font-medium text-ll-on-primary transition-colors hover:bg-ll-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>
    </form>
  );
}
