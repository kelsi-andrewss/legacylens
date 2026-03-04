"use client";

import { HelpCircle } from "lucide-react";
import { type Lens } from "@/lib/prompts";

interface ModeSelectorProps {
  mode: string;
  onModeChange: (mode: string) => void;
  lens: Lens;
  onLensChange?: (lens: Lens) => void;
}

const MODES = [
  { id: "explain", label: "Explain", desc: "Plain English explanation" },
  { id: "dependencies", label: "Dependencies", desc: "Call graph & dependency map" },
  { id: "docs", label: "Generate Docs", desc: "Structured documentation" },
  { id: "translate", label: "Translate", desc: "Modern language equivalents" },
];

const LENSES: { id: Lens; label: string; desc: string }[] = [
  { id: "porter", label: "Porter", desc: "Portability concerns, platform-specific assumptions, performance-critical sections" },
  { id: "debugger", label: "Debugger", desc: "Failure modes, numerical edge cases, preconditions often violated" },
  { id: "learner", label: "Learner", desc: "Core concepts, intuitive analogies, student-friendly framing" },
];

export default function ModeSelector({ mode, onModeChange, lens, onLensChange }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted">Analysis mode: <span data-tooltip="Analysis mode defines the output format: how the answer is structured and what it focuses on." className="inline-flex items-center"><HelpCircle className="w-3.5 h-3.5 cursor-help" /></span></span>
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

      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ll-on-surface-muted">Lens: <span data-tooltip="Lens filters the technical perspective: Porter focuses on portability, Debugger on failure modes, Learner on concepts." className="inline-flex items-center"><HelpCircle className="w-3.5 h-3.5 cursor-help" /></span></span>
        <div className="flex flex-wrap gap-2">
          {LENSES.map((l) => (
            <button
              key={l.id}
              onClick={() => onLensChange?.(l.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                lens === l.id
                  ? "bg-ll-secondary text-ll-on-primary"
                  : "bg-ll-surface-tonal text-ll-on-surface hover:bg-ll-outline"
              }`}
              title={l.desc}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
