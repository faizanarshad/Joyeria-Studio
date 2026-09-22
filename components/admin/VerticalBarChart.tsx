"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/format";

type Point = { label: string; value: number };

// A function prop can't cross the server/client boundary, so the caller (a
// server component) passes a format name instead of formatPKR itself.
const FORMATTERS = {
  currency: formatPKR,
  number: (v: number) => String(v),
} as const;

export default function VerticalBarChart({
  data,
  format = "currency",
  color = "#a8506b",
  height = 200,
}: {
  data: Point[];
  format?: keyof typeof FORMATTERS;
  color?: string;
  height?: number;
}) {
  const formatValue = FORMATTERS[format];
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  const slot = 32;
  const barWidth = 16;
  const width = data.length * slot;
  const baseline = height - 24;
  // Show at most ~7 date labels so they don't collide on a 14+ point axis.
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className="relative w-full overflow-x-auto">
      {hovered !== null && (
        <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-white">
          {data[hovered].label}: {formatValue(data[hovered].value)}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: width, height }}>
        <line x1={0} y1={baseline} x2={width} y2={baseline} stroke="#ecdfde" strokeWidth={1} />
        {data.map((d, i) => {
          const barHeight = Math.max(2, ((baseline - 8) * d.value) / max);
          const x = i * slot + (slot - barWidth) / 2;
          const y = baseline - barHeight;
          const showLabel = i % labelEvery === 0;
          return (
            <g
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={color} opacity={hovered === i ? 1 : 0.85} />
              <rect x={i * slot} y={0} width={slot} height={baseline} fill="transparent" />
              {showLabel && (
                <text x={i * slot + slot / 2} y={height - 6} textAnchor="middle" fontSize={9} fill="#8a7975">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
