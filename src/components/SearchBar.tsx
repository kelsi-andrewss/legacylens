"use client";

import { useState, FormEvent, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Search, Loader2 } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  externalQuery?: string;
}

export default function SearchBar({ onSearch, isLoading, externalQuery }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const { resolvedTheme } = useTheme();

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

  const isPunchCard = resolvedTheme === "punch-card";
  const hasQuery = query.trim().length > 0;

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
        {isPunchCard ? (
          <button
            type="submit"
            disabled={isLoading || !hasQuery}
            className={`toggle-switch-btn absolute right-2 top-1/2 -translate-y-1/2${hasQuery && !isLoading ? " toggle-on" : ""}`}
            aria-label={isLoading ? "Searching" : "Search"}
          >
            <span className="toggle-switch-knob" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isLoading || !hasQuery}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-ll-primary px-4 py-1.5 text-sm font-medium text-ll-on-primary transition-colors hover:bg-ll-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex items-center gap-1.5">
                <Search className="h-4 w-4" />
                Search
              </span>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
