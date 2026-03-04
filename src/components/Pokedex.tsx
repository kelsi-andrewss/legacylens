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

  // Also refresh when the component re-renders (toggle open)
  useEffect(() => {
    setEntries(loadEntries());
    setStats(getStats());
  }, []);

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
      {/* Stats header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ll-on-surface">
          Subroutine Collection
        </h2>
        <div className="flex items-center gap-4 text-sm text-ll-on-surface-muted">
          <span>
            <span className="font-semibold text-ll-primary">
              {stats.discovered}
            </span>{" "}
            routines discovered
          </span>
          <span className="text-ll-outline">|</span>
          <span>
            <span className="font-semibold text-ll-primary">{stats.xp}</span>{" "}
            XP
          </span>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Filter routines..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full rounded-md border border-ll-outline bg-ll-surface px-3 py-2 text-sm text-ll-on-surface placeholder:text-ll-on-surface-muted focus:border-ll-primary focus:outline-none focus:ring-1 focus:ring-ll-primary"
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-ll-on-surface-muted">
          {entries.length === 0
            ? "No routines discovered yet. Search for LAPACK/BLAS routines to start your collection!"
            : "No routines match your filter."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((entry) => (
            <div
              key={entry.name}
              className="rounded-md border border-ll-outline bg-ll-surface p-3 transition-colors hover:border-ll-primary"
            >
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
