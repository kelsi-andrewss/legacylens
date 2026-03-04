export type ThemeId = "joy";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  previewColors: { surface: string; primary: string };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "joy",
    name: "Joy",
    description: "Unlocking/Revealing",
    previewColors: { surface: "#1a1a2e", primary: "#00d4ff" },
  },
];

export const DEFAULT_THEME: ThemeId = "joy";
