"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface AnswerStreamProps {
  content: string;
  isStreaming: boolean;
  routineNames?: string[];
  activeRoutine?: string | null;
  onRoutineHover?: (name: string | null) => void;
}

const THROTTLE_MS = 50;

const AnswerStream = React.memo(function AnswerStream({
  content,
  isStreaming,
  routineNames = [],
  activeRoutine = null,
  onRoutineHover,
}: AnswerStreamProps) {
  const { resolvedTheme } = useTheme();
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

  const handleMouseEnter = useCallback((name: string) => {
    onRoutineHoverRef.current?.(name);
  }, []);

  const handleMouseLeave = useCallback(() => {
    onRoutineHoverRef.current?.(null);
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
            className="semantic-tracer-inline"
            data-tracer-active={isActive || undefined}
            onMouseEnter={() => handleMouseEnter(text)}
            onMouseLeave={handleMouseLeave}
            {...rest}
          >
            {children}
          </code>
        );
      }

      return <code {...rest}>{children}</code>;
    },
  }), [routineNameSet, activeRoutine, handleMouseEnter, handleMouseLeave]);

  if (!rendered && !isStreaming) return null;

  const isPunchCard = resolvedTheme === "punch-card";

  return (
    <div className={`rounded-lg border border-ll-outline bg-ll-surface-variant p-6 shadow-sm${isPunchCard ? " tractor-feed" : ""}`}>
      <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-ll-surface-tonal [&_code]:text-ll-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{rendered}</ReactMarkdown>
        {isStreaming && (
          <Loader2 className="inline h-4 w-4 animate-spin text-ll-primary" />
        )}
      </div>
    </div>
  );
});

export default AnswerStream;
