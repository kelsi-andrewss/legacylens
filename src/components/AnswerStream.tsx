"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface AnswerStreamProps {
  content: string;
  isStreaming: boolean;
}

const THROTTLE_MS = 50;

const AnswerStream = React.memo(function AnswerStream({
  content,
  isStreaming,
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

  if (!rendered && !isStreaming) return null;

  const isPunchCard = resolvedTheme === "punch-card";

  return (
    <div className={`rounded-lg border border-ll-outline bg-ll-surface-variant p-6 shadow-sm${isPunchCard ? " tractor-feed" : ""}`}>
      <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-ll-surface-tonal [&_code]:text-ll-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{rendered}</ReactMarkdown>
        {isStreaming && (
          <Loader2 className="inline h-4 w-4 animate-spin text-ll-primary" />
        )}
      </div>
    </div>
  );
});

export default AnswerStream;
