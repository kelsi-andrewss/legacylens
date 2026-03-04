"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ThemeId, DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  resolvedTheme: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const MEDIA_QUERY = "(prefers-color-scheme: dark)";

function resolveSystemTheme(isDark: boolean): string {
  return isDark ? "blueprint" : "punch-card";
}

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  // Graceful fallback: treat removed "kinetic-obsidian" as "punch-card"
  if (stored === "kinetic-obsidian") return "punch-card";
  if (stored === "system" || stored === "punch-card" || stored === "blueprint") {
    return stored;
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);
  const [systemIsDark, setSystemIsDark] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MEDIA_QUERY).matches : false
  );

  const resolvedTheme = theme === "system" ? resolveSystemTheme(systemIsDark) : theme;

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const mql = window.matchMedia(MEDIA_QUERY);
    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
