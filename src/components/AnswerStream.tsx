"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "@/components/ThemeProvider";

interface AnswerStreamProps {
  content: string;
  isStreaming: boolean;
}

export default function AnswerStream({ content, isStreaming }: AnswerStreamProps) {
  const { resolvedTheme } = useTheme();

  if (!content && !isStreaming) return null;

  const isPunchCard = resolvedTheme === "punch-card";

  return (
    <div className={`rounded-lg border border-ll-outline bg-ll-surface-variant p-6 shadow-sm${isPunchCard ? " tractor-feed" : ""}`}>
      <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-ll-surface-tonal [&_code]:text-ll-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        {isStreaming && (
          <span className="inline-block h-4 w-1 animate-pulse bg-ll-primary ml-0.5" />
        )}
      </div>
    </div>
  );
}
