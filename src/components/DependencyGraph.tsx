"use client";

import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic(() => import("react-force-graph-2d") as any, {
  ssr: false,
  loading: () => (
    <div className="flex h-[150px] items-center justify-center text-xs text-ll-on-surface-muted">
      Loading graph...
    </div>
  ),
}) as React.ComponentType<Record<string, unknown>>;

const PREFIX_COLORS: Record<string, string> = {
  S: "#3B82F6", // blue
  D: "#22C55E", // green
  C: "#A855F7", // purple
  Z: "#F97316", // orange
};

const DEFAULT_COLOR = "#6B7280"; // gray for unknown prefix

function inferPrefix(name: string): string {
  const first = name.charAt(0).toUpperCase();
  return PREFIX_COLORS[first] ? first : "";
}

interface DependencyGraphProps {
  routineName: string;
  dependencies: string;
  dataTypePrefix: string;
}

interface GraphNode {
  id: string;
  label: string;
  color: string;
  isCenter: boolean;
}

interface GraphLink {
  source: string;
  target: string;
}

export default function DependencyGraph({
  routineName,
  dependencies,
  dataTypePrefix,
}: DependencyGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const deps = dependencies
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);

    const centerColor = PREFIX_COLORS[dataTypePrefix?.toUpperCase()] || DEFAULT_COLOR;

    const nodes: GraphNode[] = [
      {
        id: routineName,
        label: routineName,
        color: centerColor,
        isCenter: true,
      },
    ];

    const links: GraphLink[] = [];

    for (const dep of deps) {
      const prefix = inferPrefix(dep);
      nodes.push({
        id: dep,
        label: dep,
        color: PREFIX_COLORS[prefix] || DEFAULT_COLOR,
        isCenter: false,
      });
      links.push({ source: routineName, target: dep });
    }

    return { nodes, links };
  }, [routineName, dependencies, dataTypePrefix]);

  const nodeCanvasObject = useCallback(
    (
      node: GraphNode & { x?: number; y?: number },
      ctx: CanvasRenderingContext2D,
    ) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const radius = node.isCenter ? 6 : 4;

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();

      if (node.isCenter) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Label
      ctx.font = `${node.isCenter ? "bold " : ""}${node.isCenter ? 3.5 : 2.8}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#d1d5db";
      ctx.fillText(node.label, x, y + radius + 2);
    },
    [],
  );

  const nodePointerAreaPaint = useCallback(
    (
      node: GraphNode & { x?: number; y?: number },
      color: string,
      ctx: CanvasRenderingContext2D,
    ) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const radius = node.isCenter ? 8 : 6;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [],
  );

  const nodeLabel = useCallback((node: GraphNode) => node.label, []);

  return (
    <div
      ref={containerRef}
      className="relative mt-1 h-[150px] w-full overflow-hidden rounded border border-ll-outline bg-[#1a1a2e]"
    >
      <ForceGraph2D
        graphData={graphData}
        width={width}
        height={150}
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={nodePointerAreaPaint}
        nodeLabel={nodeLabel}
        linkColor={() => "#4b5563"}
        linkWidth={1}
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.3}
        cooldownTicks={60}
        enableZoom={false}
        enablePanInteraction={false}
      />
    </div>
  );
}
