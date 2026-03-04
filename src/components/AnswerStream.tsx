"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2 } from "lucide-react";

interface AnswerStreamProps {
  content: string;
  isStreaming: boolean;
}

export default function AnswerStream({ content, isStreaming }: AnswerStreamProps) {
  if (!content && !isStreaming) return null;

  return (
    <div className="rounded-lg border border-ll-outline bg-ll-surface-variant p-6 shadow-sm">
      <div className="prose prose-neutral dark:prose-invert max-w-none prose-pre:bg-ll-surface-tonal [&_code]:text-ll-primary">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        {isStreaming && (
          <Loader2 className="inline h-4 w-4 animate-spin text-ll-primary" />
        )}
      </div>
    </div>
  );
}
