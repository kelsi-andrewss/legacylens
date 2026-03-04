"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { THEMES, ThemeId } from "@/lib/themes";
import { Palette, Check } from "lucide-react";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  const open = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    setIsOpen(true);
  }, []);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleMouseDown);
    }
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className="text-ll-on-surface-muted hover:text-ll-on-surface transition-colors p-1"
        aria-label="Theme settings"
      >
        <Palette className="w-5 h-5" />
      </button>

      {isOpen && pos && (
        <div
          ref={panelRef}
          className="fixed z-[var(--z-dropdown)] bg-ll-surface-variant border border-ll-outline rounded-[var(--ll-radius-md)] shadow-lg min-w-[220px] p-2"
          style={{ top: pos.top, right: pos.right }}
        >
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--ll-radius-sm)] text-left transition-colors ${
                theme === t.id
                  ? "bg-ll-primary-container text-ll-on-primary-container"
                  : "hover:bg-ll-surface"
              }`}
            >
              <div className="flex items-center gap-1 shrink-0">
                {t.id === "system" ? (
                  <>
                    <span
                      className="w-3 h-3 rounded-full border border-ll-outline"
                      style={{ backgroundColor: "#F4F6FA" }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-ll-outline"
                      style={{ backgroundColor: "#080808" }}
                    />
                  </>
                ) : (
                  <>
                    <span
                      className="w-3 h-3 rounded-full border border-ll-outline"
                      style={{ backgroundColor: t.previewColors.surface }}
                    />
                    <span
                      className="w-3 h-3 rounded-full border border-ll-outline"
                      style={{ backgroundColor: t.previewColors.primary }}
                    />
                  </>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${theme !== t.id ? "text-ll-on-surface" : ""}`}>{t.name}</div>
                <div className={`text-xs ${theme === t.id ? "opacity-80" : "text-ll-on-surface-muted"}`}>{t.description}</div>
              </div>
              {theme === t.id && (
                <Check className="w-4 h-4 shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
