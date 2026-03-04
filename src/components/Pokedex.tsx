"use client";

import { useState, useEffect, useMemo } from "react";
import { getStats } from "@/lib/pokedex";

interface RoutineEntry {
  name: string;
  category: string;
  dataTypePrefix: string;
}

const POKEDEX_KEY = "ll-pokedex";

const categoryColors: Record<string, string> = {
  LAPACK: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  BLAS: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

const categoryBorderColors: Record<string, string> = {
  LAPACK: "border-l-blue-500",
  BLAS: "border-l-emerald-500",
};

const typeLabels: Record<string, string> = {
  S: "Single",
  D: "Double",
  C: "Complex",
  Z: "DComplex",
};

function loadEntries(): RoutineEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("ll-pokedex-meta");
    return raw ? (JSON.parse(raw) as RoutineEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveRoutineMeta(
  name: string,
  category: string,
  dataTypePrefix: string
): void {
  if (typeof window === "undefined") return;
  try {
    const entries = loadEntries();
    if (entries.some((e) => e.name === name)) return;
    entries.push({ name, category, dataTypePrefix });
    localStorage.setItem("ll-pokedex-meta", JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable
  }
}

export default function Pokedex() {
  const [entries, setEntries] = useState<RoutineEntry[]>([]);
  const [stats, setStats] = useState({ discovered: 0, total: 0, xp: 0 });
  const [search, setSearch] = useState("");

  useEffect(() => {
    function refresh() {
      setEntries(loadEntries());
      setStats(getStats());
    }
    refresh();

    // Re-sync when other parts of the page update localStorage
    function onStorage(e: StorageEvent) {
      if (e.key === POKEDEX_KEY || e.key === "ll-pokedex-meta" || e.key === "ll-xp") {
        refresh();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Sync from localStorage on each render (e.g. when panel toggles open).
  // Conditional setState during render is the React 19 pattern for
  // "adjusting state based on external data" without an effect.
  const latestEntries = loadEntries();
  const latestStats = getStats();
  if (
    entries.length !== latestEntries.length ||
    stats.discovered !== latestStats.discovered ||
    stats.xp !== latestStats.xp
  ) {
    setEntries(latestEntries);
    setStats(latestStats);
  }

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (typeLabels[e.dataTypePrefix] || e.dataTypePrefix)
          .toLowerCase()
          .includes(q)
    );
  }, [entries, search]);

  return (
    <div className="rounded-lg border border-ll-outline bg-ll-surface-variant p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ll-on-surface">
            Discovery Archive
          </h2>
          <p className="mt-0.5 text-xs text-ll-on-surface-muted">
            Every LAPACK &amp; BLAS routine you search is automatically collected here. Search to start exploring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-ll-outline bg-ll-surface px-2.5 py-1 text-xs font-semibold text-ll-primary">
            {stats.discovered} discovered
          </span>
          <span className="inline-flex items-center rounded-full border border-ll-outline bg-ll-surface px-2.5 py-1 text-xs font-semibold text-ll-primary">
            {stats.xp} XP
          </span>
        </div>
      </div>

      {/* Filter — only when there are entries */}
      {entries.length > 0 && (
        <input
          type="text"
          placeholder="Filter routines..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-md border border-ll-outline bg-ll-surface px-3 py-2 text-sm text-ll-on-surface placeholder:text-ll-on-surface-muted focus:border-ll-primary focus:outline-none focus:ring-1 focus:ring-ll-primary"
        />
      )}

      {/* Empty state */}
      {entries.length === 0 ? (
        <div>
          <p className="mb-2 text-center text-sm font-semibold text-ll-on-surface">
            Your archive is empty
          </p>
          <p className="mb-4 text-center text-xs text-ll-on-surface-muted">
            Search any routine to make your first discovery
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-md border border-ll-outline bg-ll-surface p-3"
              >
                <div className="mb-2 h-3 w-3/4 rounded bg-ll-surface-tonal" />
                <div className="flex gap-1">
                  <div className="h-4 w-10 rounded-full bg-ll-surface-tonal" />
                  <div className="h-4 w-8 rounded-full bg-ll-surface-tonal" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-ll-on-surface-muted">
          No routines match your filter.
        </p>
      ) : (
        /* Populated grid */
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((entry, idx) => (
            <div
              key={entry.name}
              className={`relative rounded-md border border-ll-outline border-l-2 bg-ll-surface p-3 transition-colors hover:border-ll-primary ${
                categoryBorderColors[entry.category] || "border-l-ll-outline"
              }`}
            >
              {/* Discovery order */}
              <span
                className="absolute right-2 top-1.5 text-ll-on-surface-muted"
                style={{ fontSize: "9px" }}
              >
                #{idx + 1}
              </span>
              <p className="truncate text-sm font-semibold text-ll-on-surface">
                {entry.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.category && (
                  <span
                    className={`inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${
                      categoryColors[entry.category] ||
                      "bg-ll-surface-tonal text-ll-on-surface-muted border-ll-outline"
                    }`}
                  >
                    {entry.category}
                  </span>
                )}
                {entry.dataTypePrefix && (
                  <span className="inline-block rounded-full border border-ll-outline bg-ll-surface-tonal px-1.5 py-0.5 text-[10px] font-medium text-ll-on-surface-muted">
                    {typeLabels[entry.dataTypePrefix] || entry.dataTypePrefix}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
