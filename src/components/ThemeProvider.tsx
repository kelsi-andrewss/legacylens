"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useSyncExternalStore } from "react";
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

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [theme, setThemeState] = useState<ThemeId>(() => readStoredTheme());
  const [systemIsDark, setSystemIsDark] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(MEDIA_QUERY).matches : false
  );

  const resolvedTheme = mounted
    ? theme === "system" ? resolveSystemTheme(systemIsDark) : theme
    : DEFAULT_THEME;

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem(THEME_STORAGE_KEY, t);
  }, []);

  // Apply theme to document after mount
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  // Listen for system color scheme changes
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
