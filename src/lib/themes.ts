export type ThemeId = "system" | "punch-card" | "kinetic-obsidian" | "blueprint";

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
    previewColors: { surface: "#F5F0E8", primary: "#C4541A" },
  },
  {
    id: "kinetic-obsidian",
    name: "Kinetic Obsidian",
    description: "Dark pro IDE",
    previewColors: { surface: "#080808", primary: "#00F5A0" },
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "Engineering draft",
    previewColors: { surface: "#F4F6FA", primary: "#1B3A6B" },
  },
];

export const DEFAULT_THEME: ThemeId = "kinetic-obsidian";
export const THEME_STORAGE_KEY = "ll-theme";
