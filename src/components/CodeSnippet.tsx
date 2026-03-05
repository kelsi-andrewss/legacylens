"use client";

import { useState, useCallback } from "react";
import { ExternalLink, Maximize2, Minimize2 } from "lucide-react";
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
  isDirectMatch?: boolean;
  activeRoutine?: string | null;
  onRoutineHover?: (name: string | null) => void;
  onRoutineClick?: (name: string) => void;
}

export default function CodeSnippet({ chunk, onPin, isPinned, isDirectMatch, activeRoutine, onRoutineHover, onRoutineClick }: CodeSnippetProps) {
  const { metadata: m, score } = chunk;
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fullSource, setFullSource] = useState<string | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);

  const handlePin = useCallback(() => {
    if (isPinned || !onPin) return;
    onPin(chunk);
    setShowPinConfirm(true);
    const timer = setTimeout(() => setShowPinConfirm(false), 1500);
    return () => clearTimeout(timer);
  }, [chunk, onPin, isPinned]);

  const handleExpandToggle = useCallback(() => {
    const filePath = m.file_path;
    if (fullSource !== null) {
      setExpanded((prev) => !prev);
      return;
    }
    setExpanded(true);
    setSourceLoading(true);
    setSourceError(null);
    fetch(`/api/source?path=${encodeURIComponent(filePath)}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body: { error?: string }) => {
            throw new Error(body.error ?? `HTTP ${res.status}`);
          });
        }
        return res.json() as Promise<{ content: string }>;
      })
      .then((data) => {
        setFullSource(data.content);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to load source";
        setSourceError(message);
        setExpanded(false);
      })
      .finally(() => {
        setSourceLoading(false);
      });
  }, [m.file_path, fullSource]);

  const relevance = Math.max(0, Math.min(100, ((score - 0.4) / 0.45) * 100)).toFixed(1);
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
          <button
            onClick={handleExpandToggle}
            disabled={sourceLoading}
            className="text-xs text-ll-on-surface-muted hover:text-ll-on-surface transition-colors flex items-center gap-1"
            title={expanded ? "Collapse full source" : "View full source file"}
          >
            {expanded ? (
              <>
                Collapse <Minimize2 className="inline h-3 w-3" />
              </>
            ) : (
              <>
                Full Source <Maximize2 className="inline h-3 w-3" />
              </>
            )}
          </button>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ll-on-surface-muted hover:text-ll-on-surface transition-colors"
          >
            View on GitHub <ExternalLink className="inline h-3 w-3" />
          </a>
          {isDirectMatch ? (
            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Direct match</span>
          ) : (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              score > 0.7
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                : score > 0.55
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
            }`}>
              {relevance}% match
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-2 text-xs text-ll-on-surface-muted flex flex-wrap gap-x-4 gap-y-1 border-b border-ll-outline">
        <span>{m.file_path}:{m.line_start}-{m.line_end}</span>
        {m.parameters && <span>Params: {m.parameters}</span>}
        {m.dependencies && onRoutineClick && (
          <span className="flex flex-wrap gap-1">
            <span className="text-ll-on-surface-muted">Deps:</span>
            {m.dependencies
              .split(",")
              .map((d) => d.trim())
              .filter(Boolean)
              .map((dep) => (
                <button
                  key={dep}
                  onClick={() => onRoutineClick(dep)}
                  className="font-mono underline decoration-dotted cursor-pointer hover:text-ll-primary transition-colors"
                  title={`Navigate to ${dep}`}
                >
                  {dep}
                </button>
              ))}
          </span>
        )}
      </div>

      {m.dependencies && (
        <div className="border-b border-ll-outline">
          <DependencyGraph
            routineName={m.subroutine_name}
            dependencies={m.dependencies}
            dataTypePrefix={m.data_type_prefix}
            onRoutineClick={onRoutineClick}
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

      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded && fullSource ? "max-h-[600px]" : "max-h-0"
        }`}
      >
        {sourceLoading && (
          <div className="px-4 py-3 text-xs text-ll-on-surface-muted border-t border-ll-outline">
            Loading full source...
          </div>
        )}
        {sourceError && (
          <div className="px-4 py-3 text-xs text-red-500 border-t border-ll-outline">
            Error: {sourceError}
          </div>
        )}
        {fullSource && (
          <div className="border-t border-ll-outline max-h-[600px] overflow-y-auto overflow-x-auto">
            <SyntaxHighlighter
              language="fortran"
              style={atomOneDark}
              showLineNumbers
              startingLineNumber={1}
              customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.8rem" }}
              wrapLongLines={false}
              codeTagProps={{ className: "min-w-full break-words" }}
            >
              {fullSource}
            </SyntaxHighlighter>
          </div>
        )}
      </div>
    </div>
  );
}
