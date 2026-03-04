"use client";

interface ModeSelectorProps {
  mode: string;
  onModeChange: (mode: string) => void;
}

const MODES = [
  { id: "explain", label: "Explain", desc: "Plain English explanation" },
  { id: "dependencies", label: "Dependencies", desc: "Call graph & dependency map" },
  { id: "docs", label: "Generate Docs", desc: "Structured documentation" },
  { id: "translate", label: "Translate", desc: "Modern language equivalents" },
];

export default function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted">Analysis mode:</span>
      <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === m.id
              ? "bg-ll-primary text-ll-on-primary"
              : "bg-ll-surface-tonal text-ll-on-surface hover:bg-ll-outline"
          }`}
          title={m.desc}
        >
          {m.label}
        </button>
      ))}
      </div>
    </div>
  );
}
