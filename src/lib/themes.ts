export type ThemeId = "system" | "punch-card" | "blueprint" | "joy";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  previewColors: { surface: string; primary: string };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "system",
    name: "System",
    description: "Follows your OS preference",
    previewColors: { surface: "#888", primary: "#888" },
  },
  {
    id: "punch-card",
    name: "Punch Card",
    description: "Retro mainframe",
    previewColors: { surface: "#F5F0E8", primary: "#C2410C" },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Engineering draft",
    previewColors: { surface: "#F4F6FA", primary: "#1B3A6B" },
  },
  {
    id: "joy",
    name: "Joy",
    description: "Unlocking/Revealing",
    previewColors: { surface: "#1a1a2e", primary: "#00d4ff" },
  },
];

export const DEFAULT_THEME: ThemeId = "punch-card";
export const THEME_STORAGE_KEY = "ll-theme";
