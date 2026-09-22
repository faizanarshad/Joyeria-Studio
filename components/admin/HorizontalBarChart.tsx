"use client";

import { formatPKR } from "@/lib/format";

type Bar = { label: string; value: number; color?: string };

// A function prop can't cross the server/client boundary, so the caller (a
// server component) passes a format name instead of a formatter function.
const FORMATTERS = {
  number: (v: number) => String(v),
  sold: (v: number) => `${v} sold`,
  currency: formatPKR,
} as const;

export default function HorizontalBarChart({
  data,
  format = "number",
  defaultColor = "#a8506b",
}: {
  data: Bar[];
  format?: keyof typeof FORMATTERS;
  defaultColor?: string;
}) {
  const formatValue = FORMATTERS[format];
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.every((d) => d.value === 0)) {
    return <p className="text-sm text-muted">No data yet.</p>;
  }

  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{d.label}</span>
            <span className="text-muted">{formatValue(d.value)}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-border/60">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                backgroundColor: d.color ?? defaultColor,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
