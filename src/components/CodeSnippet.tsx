"use client";

import { useState, useCallback } from "react";
import { ExternalLink } from "lucide-react";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import fortran from "react-syntax-highlighter/dist/esm/languages/hljs/fortran";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import DependencyGraph from "./DependencyGraph";

SyntaxHighlighter.registerLanguage("fortran", fortran);

export interface ChunkData {
  id: string;
  score: number;
  metadata: {
    subroutine_name: string;
    kind: string;
    file_path: string;
    line_start: number;
    line_end: number;
    parameters: string;
    dependencies: string;
    data_type_prefix: string;
    category: string;
    text: string;
  };
}

interface CodeSnippetProps {
  chunk: ChunkData;
  onPin?: (chunk: ChunkData) => void;
  isPinned?: boolean;
  activeRoutine?: string | null;
  onRoutineHover?: (name: string | null) => void;
}

export default function CodeSnippet({ chunk, onPin, isPinned, activeRoutine, onRoutineHover }: CodeSnippetProps) {
  const { metadata: m, score } = chunk;
  const [showPinConfirm, setShowPinConfirm] = useState(false);

  const handlePin = useCallback(() => {
    if (isPinned || !onPin) return;
    onPin(chunk);
    setShowPinConfirm(true);
    const timer = setTimeout(() => setShowPinConfirm(false), 1500);
    return () => clearTimeout(timer);
  }, [chunk, onPin, isPinned]);
  const relevance = (score * 100).toFixed(1);
  const githubUrl = `https://github.com/Reference-LAPACK/lapack/blob/master/${m.file_path}#L${m.line_start}`;
  const isTracerActive = activeRoutine === m.subroutine_name;

  const handleBadgeEnter = useCallback(() => {
    onRoutineHover?.(m.subroutine_name);
  }, [onRoutineHover, m.subroutine_name]);

  const handleBadgeLeave = useCallback(() => {
    onRoutineHover?.(null);
  }, [onRoutineHover]);

  return (
    <div
      className="snap-focus semantic-tracer-card rounded-lg border border-ll-outline bg-ll-surface-variant shadow-sm overflow-hidden"
      data-tracer-active={isTracerActive || undefined}
    >
      <div className="flex items-center justify-between border-b border-ll-outline bg-ll-surface-tonal px-4 py-2">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-sm font-semibold text-ll-on-surface semantic-tracer-badge"
            onMouseEnter={handleBadgeEnter}
            onMouseLeave={handleBadgeLeave}
            style={{ cursor: onRoutineHover ? "pointer" : undefined }}
          >
            {m.kind} {m.subroutine_name}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            m.category === "BLAS"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          }`}>
            {m.category}
          </span>
          {m.data_type_prefix && (
            <span className="rounded-full bg-ll-surface-tonal px-2 py-0.5 text-xs font-medium text-ll-on-surface-muted">
              {m.data_type_prefix}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {onPin && (
            <button
              onClick={handlePin}
              disabled={isPinned}
              className={`text-xs transition-colors ${
                showPinConfirm
                  ? "text-green-600 dark:text-green-400"
                  : isPinned
                    ? "text-ll-on-surface-muted/50 cursor-default"
                    : "text-ll-on-surface-muted hover:text-ll-on-surface"
              }`}
              title={isPinned ? "Already pinned" : "Pin to scratchpad"}
            >
              {showPinConfirm ? "Pinned!" : isPinned ? "Pinned" : "Pin"}
            </button>
          )}
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ll-on-surface-muted hover:text-ll-on-surface transition-colors"
          >
            View on GitHub <ExternalLink className="inline h-3 w-3" />
          </a>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            score > 0.8
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : score > 0.6
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
          }`}>
            {relevance}% match
          </span>
        </div>
      </div>

      <div className="px-4 py-2 text-xs text-ll-on-surface-muted flex flex-wrap gap-x-4 gap-y-1 border-b border-ll-outline">
        <span>{m.file_path}:{m.line_start}-{m.line_end}</span>
        {m.parameters && <span>Params: {m.parameters}</span>}
      </div>

      {m.dependencies && (
        <div className="border-b border-ll-outline">
          <DependencyGraph
            routineName={m.subroutine_name}
            dependencies={m.dependencies}
            dataTypePrefix={m.data_type_prefix}
          />
        </div>
      )}

      <div className="max-h-96 overflow-y-auto overflow-x-auto">
        <SyntaxHighlighter
          language="fortran"
          style={atomOneDark}
          showLineNumbers
          startingLineNumber={m.line_start}
          customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.8rem" }}
          wrapLongLines={false}
          codeTagProps={{ className: "min-w-full break-words" }}
        >
          {m.text}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
