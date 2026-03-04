"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { THEMES, ThemeId } from "@/lib/themes";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleMouseDown);
    }
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen]);

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="text-ll-on-surface-muted hover:text-ll-on-surface transition-colors p-1"
        aria-label="Theme settings"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"
            fill="currentColor"
          />
          <path
            d="M17.43 10.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.3 7.3 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 12 0H8a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.49.49 0 0 0 .12.64l2.11 1.65A8 8 0 0 0 2.5 10c0 .34.03.66.07.98L.46 12.63a.5.5 0 0 0-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.05.24.26.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1a.5.5 0 0 0 .61-.22l2-3.46a.49.49 0 0 0-.12-.64l-2.11-1.65Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-ll-surface-variant border border-ll-outline rounded-[var(--ll-radius-md)] shadow-lg min-w-[220px] p-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-[var(--ll-radius-sm)] text-left transition-colors ${
                theme === t.id
                  ? "bg-ll-primary-container"
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
                <div className="text-sm font-medium text-ll-on-surface">{t.name}</div>
                <div className="text-xs text-ll-on-surface-muted">{t.description}</div>
              </div>
              {theme === t.id && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-ll-primary">
                  <path d="M13.3 4.3 6 11.6 2.7 8.3l1-1L6 9.6l6.3-6.3 1 1Z" fill="currentColor" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
