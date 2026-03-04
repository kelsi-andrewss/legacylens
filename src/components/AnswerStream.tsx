"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnswerStreamProps {
  content: string;
  isStreaming: boolean;
}

const THROTTLE_MS = 50;

const AnswerStream = React.memo(function AnswerStream({
  content,
  isStreaming,
}: AnswerStreamProps) {
  const latestContent = useRef(content);
  const [rendered, setRendered] = useState(content);

  // Keep ref in sync with latest content prop
  useEffect(() => {
    latestContent.current = content;
  }, [content]);

  // Flush immediately when streaming stops to guarantee final content is shown
  useEffect(() => {
    if (!isStreaming) {
      setRendered(latestContent.current);
    }
  }, [isStreaming, content]);

  // Throttled flush during streaming
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

  if (!rendered && !isStreaming) return null;

  return (
    <div className="rounded-lg border border-ll-outline bg-ll-surface-variant p-6 shadow-sm">
      <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-ll-surface-tonal [&_code]:text-ll-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{rendered}</ReactMarkdown>
        {isStreaming && (
          <span className="inline-block h-4 w-1 animate-pulse bg-ll-primary ml-0.5" />
        )}
      </div>
    </div>
  );
});

export default AnswerStream;
