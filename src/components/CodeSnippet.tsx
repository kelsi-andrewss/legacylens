"use client";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import fortran from "react-syntax-highlighter/dist/esm/languages/hljs/fortran";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

SyntaxHighlighter.registerLanguage("fortran", fortran);

interface ChunkData {
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
}

export default function CodeSnippet({ chunk }: CodeSnippetProps) {
  const { metadata: m, score } = chunk;
  const relevance = (score * 100).toFixed(1);
  const githubUrl = `https://github.com/Reference-LAPACK/lapack/blob/master/${m.file_path}#L${m.line_start}`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
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
            <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
              {m.data_type_prefix}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            View on GitHub ↗
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

      <div className="px-4 py-2 text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-4 gap-y-1 border-b border-zinc-100 dark:border-zinc-800">
        <span>{m.file_path}:{m.line_start}-{m.line_end}</span>
        {m.parameters && <span>Params: {m.parameters}</span>}
        {m.dependencies && <span>Calls: {m.dependencies}</span>}
      </div>

      <div className="max-h-80 overflow-auto">
        <SyntaxHighlighter
          language="fortran"
          style={atomOneDark}
          showLineNumbers
          startingLineNumber={m.line_start}
          customStyle={{ margin: 0, borderRadius: 0, fontSize: "0.8rem" }}
        >
          {m.text}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
