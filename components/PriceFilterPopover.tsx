"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPKR } from "@/lib/format";

export default function PriceFilterPopover({
  basePath,
  bounds,
  currentMin,
  currentMax,
  otherParams,
}: {
  basePath: string;
  bounds: { min: number; max: number };
  currentMin: number | null;
  currentMax: number | null;
  otherParams: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(currentMin ?? bounds.min);
  const [max, setMax] = useState(currentMax ?? bounds.max);
  const rootRef = useRef<HTMLDivElement>(null);

  const isActive = currentMin !== null || currentMax !== null;
  const step = bounds.max - bounds.min > 2000 ? 50 : 10;

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function buildUrl(withMin: number | null, withMax: number | null) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(otherParams)) {
      if (value) params.set(key, value);
    }
    if (withMin !== null && withMin > bounds.min) params.set("minPrice", String(withMin));
    if (withMax !== null && withMax < bounds.max) params.set("maxPrice", String(withMax));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  function apply() {
    router.push(buildUrl(min, max));
    setOpen(false);
  }

  function clear() {
    setMin(bounds.min);
    setMax(bounds.max);
    router.push(buildUrl(null, null));
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`rounded-full border px-3 py-1.5 text-sm ${
          isActive ? "border-rose bg-rose text-white" : "border-border text-foreground/80"
        }`}
      >
        {isActive ? `${formatPKR(min)} – ${formatPKR(max)}` : "Price"}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-surface p-5 shadow-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">{formatPKR(min)}</span>
            <span className="text-muted">to</span>
            <span className="font-medium text-foreground">{formatPKR(max)}</span>
          </div>

          <div className="relative mt-5 h-4">
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-rose"
              style={{
                left: `${((min - bounds.min) / (bounds.max - bounds.min || 1)) * 100}%`,
                right: `${100 - ((max - bounds.min) / (bounds.max - bounds.min || 1)) * 100}%`,
              }}
            />
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={step}
              value={min}
              onChange={(e) => setMin(Math.min(Number(e.target.value), max - step))}
              className="range-thumb pointer-events-none absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 appearance-none bg-transparent"
            />
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={step}
              value={max}
              onChange={(e) => setMax(Math.max(Number(e.target.value), min + step))}
              className="range-thumb pointer-events-none absolute inset-x-0 top-1/2 h-4 w-full -translate-y-1/2 appearance-none bg-transparent"
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={clear} className="text-xs text-muted hover:text-rose">
              Clear
            </button>
            <button
              type="button"
              onClick={apply}
              className="rounded-full bg-rose px-4 py-1.5 text-xs text-white hover:bg-rose-dark"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
