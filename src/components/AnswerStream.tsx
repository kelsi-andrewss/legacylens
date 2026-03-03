"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnswerStreamProps {
  content: string;
  isStreaming: boolean;
}

export default function AnswerStream({ content, isStreaming }: AnswerStreamProps) {
  if (!content && !isStreaming) return null;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="prose prose-zinc dark:prose-invert max-w-none prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-800 prose-code:text-blue-600 dark:prose-code:text-blue-400">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        {isStreaming && (
          <span className="inline-block h-4 w-1 animate-pulse bg-blue-500 ml-0.5" />
        )}
      </div>
    </div>
  );
}
