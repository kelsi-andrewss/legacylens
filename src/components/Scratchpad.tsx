"use client";

import { useState, useCallback } from "react";

export interface PinnedItem {
  id: string;
  subroutine_name: string;
  kind: string;
  file_path: string;
  text: string;
  annotation: string;
  pinnedAt: number;
}

interface ScratchpadProps {
  items: PinnedItem[];
  onRemove: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onAnnotate: (id: string, annotation: string) => void;
}

function exportAsMarkdown(items: PinnedItem[]) {
  const lines: string[] = [
    "# LegacyLens Scratchpad",
    "",
    `Exported: ${new Date().toLocaleString()}`,
    "",
    `${items.length} pinned routine${items.length === 1 ? "" : "s"}`,
    "",
    "---",
    "",
  ];

  for (const item of items) {
    lines.push(`## ${item.kind} ${item.subroutine_name}`);
    lines.push("");
    lines.push(`**File:** \`${item.file_path}\``);
    lines.push("");
    if (item.annotation) {
      lines.push(`**Notes:** ${item.annotation}`);
      lines.push("");
    }
    lines.push("```fortran");
    lines.push(item.text);
    lines.push("```");
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `legacylens-scratchpad-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Scratchpad({
  items,
  onRemove,
  onReorder,
  onAnnotate,
}: ScratchpadProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleExport = useCallback(() => {
    if (items.length > 0) exportAsMarkdown(items);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      {/* Desktop: right sidebar */}
      <aside className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted">
              Scratchpad
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ll-primary-container text-[10px] font-bold text-ll-on-primary-container">
                {items.length}
              </span>
            </h3>
            <button
              onClick={handleExport}
              className="rounded px-2 py-1 text-xs text-ll-on-surface-muted hover:bg-ll-surface-tonal transition-colors"
              title="Export as Markdown"
            >
              Export .md
            </button>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
            {items.map((item, i) => (
              <ScratchpadCard
                key={item.id}
                item={item}
                index={i}
                total={items.length}
                onRemove={onRemove}
                onReorder={onReorder}
                onAnnotate={onAnnotate}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile: collapsible bottom panel */}
      <div className="fixed inset-x-0 bottom-0 z-[var(--z-sticky)] lg:hidden">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between border-t border-ll-outline bg-ll-surface-variant px-4 py-2"
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted">
            Scratchpad
            <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-ll-primary-container text-[10px] font-bold text-ll-on-primary-container">
              {items.length}
            </span>
          </span>
          <span className="text-ll-on-surface-muted text-sm">
            {isOpen ? "\u25BC" : "\u25B2"}
          </span>
        </button>
        {isOpen && (
          <div className="max-h-64 overflow-y-auto border-t border-ll-outline bg-ll-surface px-4 py-3 space-y-2">
            <div className="flex justify-end mb-1">
              <button
                onClick={handleExport}
                className="rounded px-2 py-1 text-xs text-ll-on-surface-muted hover:bg-ll-surface-tonal transition-colors"
              >
                Export .md
              </button>
            </div>
            {items.map((item, i) => (
              <ScratchpadCard
                key={item.id}
                item={item}
                index={i}
                total={items.length}
                onRemove={onRemove}
                onReorder={onReorder}
                onAnnotate={onAnnotate}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ScratchpadCard({
  item,
  index,
  total,
  onRemove,
  onReorder,
  onAnnotate,
}: {
  item: PinnedItem;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down") => void;
  onAnnotate: (id: string, annotation: string) => void;
}) {
  return (
    <div className="rounded-lg border border-ll-outline bg-ll-surface-variant p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-semibold text-ll-on-surface">
            {item.kind} {item.subroutine_name}
          </p>
          <p className="truncate text-[10px] text-ll-on-surface-muted">
            {item.file_path}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => onReorder(item.id, "up")}
            disabled={index === 0}
            className="rounded p-1 text-ll-on-surface-muted hover:bg-ll-surface-tonal disabled:opacity-30 transition-colors"
            title="Move up"
            aria-label="Move up"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2L10 8H2L6 2Z" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => onReorder(item.id, "down")}
            disabled={index === total - 1}
            className="rounded p-1 text-ll-on-surface-muted hover:bg-ll-surface-tonal disabled:opacity-30 transition-colors"
            title="Move down"
            aria-label="Move down"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 10L2 4H10L6 10Z" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="rounded p-1 text-ll-on-surface-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Remove"
            aria-label="Remove from scratchpad"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <pre className="max-h-20 overflow-auto rounded bg-ll-surface-tonal p-2 text-[10px] font-mono text-ll-on-surface leading-tight">
        {item.text.slice(0, 300)}
        {item.text.length > 300 ? "..." : ""}
      </pre>
      <textarea
        value={item.annotation}
        onChange={(e) => onAnnotate(item.id, e.target.value)}
        placeholder="Add notes..."
        rows={2}
        className="w-full resize-none rounded border border-ll-outline bg-ll-surface px-2 py-1.5 text-xs text-ll-on-surface placeholder:text-ll-on-surface-muted/50 focus:border-ll-primary focus:outline-none transition-colors"
      />
    </div>
  );
}
