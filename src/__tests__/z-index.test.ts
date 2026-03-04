import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const SRC = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf-8");

describe("z-index hierarchy", () => {
  const globals = read("app/globals.css");
  const themePicker = read("components/ThemePicker.tsx");
  const toast = read("components/ChallengeToast.tsx");
  const scratchpad = read("components/Scratchpad.tsx");

  test("no body > * rule that sets z-index (stacking context factory)", () => {
    expect(globals).not.toMatch(/body\s*>\s*\*[\s\S]*?z-index/);
  });

  test("blueprint decorative overlays use negative z-index", () => {
    const beforeAfter = globals.match(
      /\[data-theme="blueprint"\]\s+body::(?:before|after)\s*\{[^}]+\}/g
    );
    expect(beforeAfter).not.toBeNull();
    for (const block of beforeAfter!) {
      const zMatch = block.match(/z-index:\s*(.+?);/);
      expect(zMatch).not.toBeNull();
      const val = zMatch![1].trim();
      const isNegative = val.startsWith("-") || val.includes("--z-decoration");
      expect(isNegative).toBe(true);
    }
  });

  test("header z-index < dropdown z-index < toast z-index", () => {
    const scale: Record<string, number> = {};
    const varMatches = globals.matchAll(/--z-(\w+):\s*(-?\d+)/g);
    for (const m of varMatches) {
      scale[m[1]] = parseInt(m[2], 10);
    }
    expect(scale.sticky).toBeLessThan(scale.dropdown);
    expect(scale.dropdown).toBeLessThan(scale.toast);
  });

  test("mobile scratchpad z-index <= header z-index", () => {
    const mobilePanel = scratchpad.match(/fixed inset-x-0 bottom-0 z-\[([^\]]+)\]/);
    expect(mobilePanel).not.toBeNull();
    const val = mobilePanel![1];
    expect(val).toContain("--z-sticky");
  });

  test("ThemePicker dropdown uses fixed positioning", () => {
    const dropdownDiv = themePicker.match(/className="fixed.*z-\[var\(--z-dropdown\)\]/);
    expect(dropdownDiv).not.toBeNull();
    expect(themePicker).not.toMatch(/className="absolute.*z-\[100\]/);
  });
});
