"use client";

import React, { createContext, useContext, useEffect } from "react";
import { ThemeId } from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  resolvedTheme: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STATIC_THEME: ThemeId = "joy";

const contextValue: ThemeContextValue = {
  theme: STATIC_THEME,
  setTheme: () => {},
  resolvedTheme: STATIC_THEME,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.dataset.theme = STATIC_THEME;
  }, []);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
