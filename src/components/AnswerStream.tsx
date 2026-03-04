"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import { detectRoutineSpans } from "@/lib/routineParser";

interface AnswerStreamProps {
  content: string;
  isStreaming: boolean;
  routineNames?: string[];
  activeRoutine?: string | null;
  onRoutineHover?: (name: string | null) => void;
  onRoutineClick?: (name: string) => void;
}

const THROTTLE_MS = 50;

/**
 * Renders a plain text node with detected Fortran routine names wrapped in
 * clickable/hoverable <span> elements. Only annotates when onRoutineClick is provided.
 */
function AnnotatedText({
  text,
  activeRoutine,
  onRoutineHover,
  onRoutineClick,
}: {
  text: string;
  activeRoutine: string | null;
  onRoutineHover?: (name: string | null) => void;
  onRoutineClick?: (name: string) => void;
}) {
  const spans = useMemo(() => detectRoutineSpans(text), [text]);

  if (spans.length === 0 || !onRoutineClick) {
    return <>{text}</>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const span of spans) {
    if (span.start > cursor) {
      parts.push(text.slice(cursor, span.start));
    }
    const name = span.name;
    const isActive = activeRoutine === name;
    parts.push(
      <span
        key={`${name}-${span.start}`}
        onClick={() => onRoutineClick(name)}
        onMouseEnter={() => onRoutineHover?.(name)}
        onMouseLeave={() => onRoutineHover?.(null)}
        className={`routine-link cursor-pointer underline decoration-dotted transition-colors hover:text-ll-primary${isActive ? " text-ll-primary" : ""}`}
        title={`Navigate to ${name}`}
      >
        {name}
      </span>
    );
    cursor = span.end;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return <>{parts}</>;
}

const AnswerStream = React.memo(function AnswerStream({
  content,
  isStreaming,
  routineNames = [],
  activeRoutine = null,
  onRoutineHover,
  onRoutineClick,
}: AnswerStreamProps) {
  const latestContent = useRef(content);
  const [rendered, setRendered] = useState(content);

  useEffect(() => {
    latestContent.current = content;
  }, [content]);

  useEffect(() => {
    if (!isStreaming) {
      setRendered(latestContent.current);
    }
  }, [isStreaming, content]);

  useEffect(() => {
    if (!isStreaming) return;

    const id = setInterval(() => {
      setRendered((prev) => {
        const latest = latestContent.current;
        return latest !== prev ? latest : prev;
      });
    }, THROTTLE_MS);

    return () => clearInterval(id);
  }, [isStreaming]);

  const routineNameSet = useMemo(() => new Set(routineNames), [routineNames]);

  const onRoutineHoverRef = useRef(onRoutineHover);
  useEffect(() => {
    onRoutineHoverRef.current = onRoutineHover;
  }, [onRoutineHover]);

  const onRoutineClickRef = useRef(onRoutineClick);
  useEffect(() => {
    onRoutineClickRef.current = onRoutineClick;
  }, [onRoutineClick]);

  const handleMouseEnter = useCallback((name: string) => {
    onRoutineHoverRef.current?.(name);
  }, []);

  const handleMouseLeave = useCallback(() => {
    onRoutineHoverRef.current?.(null);
  }, []);

  const handleClick = useCallback((name: string) => {
    onRoutineClickRef.current?.(name);
  }, []);

  const markdownComponents = useMemo<Components>(() => ({
    code: ({ children, className, ...rest }) => {
      const isBlock = Boolean(className);
      const text = String(children).replace(/\n$/, "");

      if (isBlock) {
        return <code className={className} {...rest}>{children}</code>;
      }

      if (routineNameSet.has(text)) {
        const isActive = activeRoutine === text;
        return (
          <code
            className={`semantic-tracer-inline${onRoutineClickRef.current ? " cursor-pointer underline decoration-dotted hover:text-ll-primary" : ""}`}
            data-tracer-active={isActive || undefined}
            onMouseEnter={() => handleMouseEnter(text)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(text)}
            {...rest}
          >
            {children}
          </code>
        );
      }

      return <code {...rest}>{children}</code>;
    },
    // Override paragraph nodes to inject routine-name spans into plain text children
    p: ({ children }) => (
      <p>
        {React.Children.map(children, (child) => {
          if (typeof child === "string") {
            return (
              <AnnotatedText
                text={child}
                activeRoutine={activeRoutine}
                onRoutineHover={onRoutineHoverRef.current}
                onRoutineClick={onRoutineClickRef.current}
              />
            );
          }
          return child;
        })}
      </p>
    ),
    // Override list-item nodes to inject routine-name spans into plain text children
    li: ({ children }) => (
      <li>
        {React.Children.map(children, (child) => {
          if (typeof child === "string") {
            return (
              <AnnotatedText
                text={child}
                activeRoutine={activeRoutine}
                onRoutineHover={onRoutineHoverRef.current}
                onRoutineClick={onRoutineClickRef.current}
              />
            );
          }
          return child;
        })}
      </li>
    ),
  }), [routineNameSet, activeRoutine, handleMouseEnter, handleMouseLeave, handleClick]);

  if (!rendered && !isStreaming) return null;

  return (
    <div className="rounded-lg border border-ll-outline bg-ll-surface-variant p-6 shadow-sm reveal-enter max-h-[32rem] overflow-y-auto overflow-x-hidden">
      <div className={`prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-ll-surface-tonal prose-pre:overflow-x-auto [&_code]:text-ll-primary${isStreaming ? " warm-streaming-glow" : ""}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{rendered}</ReactMarkdown>
        {isStreaming && (
          <Loader2 className="inline h-4 w-4 animate-spin text-ll-primary" />
        )}
      </div>
    </div>
  );
});

export default AnswerStream;
