"use client";

import { motion, useReducedMotion } from "motion/react";

/** A single large, detailed rose bloom, rotating slowly and continuously in
 * genuine 3D (rotateY sweep + a gentle rotateX tilt, inside a perspective
 * container) — a centerpiece accent, not ambient decoration. */
export default function BigRose3D({
  size = 320,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size, perspective: 1200 }}
    >
      <motion.div
        style={{ width: "100%", height: "100%", transformStyle: "preserve-3d" }}
        initial={{ rotateY: -15, rotateX: 6 }}
        animate={
          reducedMotion
            ? { rotateY: -15, rotateX: 6 }
            : { rotateY: [-15, 345], rotateX: [6, -4, 6] }
        }
        transition={
          reducedMotion
            ? undefined
            : {
                rotateY: { duration: 26, repeat: Infinity, ease: "linear" },
                rotateX: { duration: 9, repeat: Infinity, ease: "easeInOut" },
              }
        }
      >
        <RoseBloom />
      </motion.div>
    </div>
  );
}

// A rose petal: cupped base, flared belly, a soft heart-notch at the tip —
// drawn pointing "up" from the attachment point at the origin, meant to be
// positioned/rotated/scaled per instance.
const PETAL_PATH =
  "M0,0 C-15,-6 -23,-20 -19,-34 C-23,-43 -15,-52 -6,-50 C-2,-53 2,-53 6,-50 " +
  "C15,-52 23,-43 19,-34 C23,-20 15,-6 0,0 Z";

const PETAL_FOLD =
  "M0,-2 C-9,-8 -14,-19 -11,-31 C-7,-24 -3,-15 0,-6 C3,-15 7,-24 11,-31 C14,-19 9,-8 0,-2 Z";

type PetalSpec = {
  ring: number;
  angle: number;
  radius: number;
  scale: number;
  rotate: number;
};

// Four rings, irregular angle offsets and per-petal scale jitter — an even
// radial array reads as a generic flower icon; the slight asymmetry here is
// what makes it read as a bloom instead.
const PETALS: PetalSpec[] = [
  // outer ring — largest, most open
  { ring: 0, angle: 8, radius: 30, scale: 1.24, rotate: 4 },
  { ring: 0, angle: 68, radius: 30, scale: 1.18, rotate: -3 },
  { ring: 0, angle: 132, radius: 31, scale: 1.22, rotate: 6 },
  { ring: 0, angle: 196, radius: 29, scale: 1.16, rotate: -5 },
  { ring: 0, angle: 254, radius: 30, scale: 1.2, rotate: 3 },
  { ring: 0, angle: 312, radius: 31, scale: 1.15, rotate: -4 },
  // middle ring
  { ring: 1, angle: 30, radius: 19, scale: 0.92, rotate: 5 },
  { ring: 1, angle: 100, radius: 18, scale: 0.88, rotate: -6 },
  { ring: 1, angle: 168, radius: 19, scale: 0.9, rotate: 4 },
  { ring: 1, angle: 236, radius: 18, scale: 0.86, rotate: -3 },
  { ring: 1, angle: 300, radius: 19, scale: 0.9, rotate: 5 },
  // inner ring — tighter, still slightly open
  { ring: 2, angle: 15, radius: 10, scale: 0.6, rotate: 8 },
  { ring: 2, angle: 95, radius: 10, scale: 0.58, rotate: -6 },
  { ring: 2, angle: 175, radius: 10, scale: 0.6, rotate: 7 },
  { ring: 2, angle: 255, radius: 10, scale: 0.57, rotate: -8 },
  // center bud — tightly curled
  { ring: 3, angle: 40, radius: 3, scale: 0.34, rotate: 12 },
  { ring: 3, angle: 160, radius: 3, scale: 0.32, rotate: -10 },
  { ring: 3, angle: 280, radius: 3, scale: 0.33, rotate: 9 },
];

const RING_FILL = ["url(#petal-outer)", "url(#petal-mid)", "url(#petal-inner)", "url(#petal-core)"];

function RoseBloom() {
  const cx = 100;
  const cy = 104;

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-xl">
      <defs>
        <linearGradient id="petal-outer" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#6e2d42" />
          <stop offset="55%" stopColor="#96435c" />
          <stop offset="100%" stopColor="#c1607a" />
        </linearGradient>
        <linearGradient id="petal-mid" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#8a3d56" />
          <stop offset="55%" stopColor="#c1607a" />
          <stop offset="100%" stopColor="#dd8299" />
        </linearGradient>
        <linearGradient id="petal-inner" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#b1546c" />
          <stop offset="60%" stopColor="#e0a0b1" />
          <stop offset="100%" stopColor="#f2c6d1" />
        </linearGradient>
        <linearGradient id="petal-core" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#c1607a" />
          <stop offset="100%" stopColor="#f7d9e1" />
        </linearGradient>
      </defs>

      {/* Leaf hints behind the bloom */}
      <path d={`M${cx} ${cy + 74}c-18-4-30-20-26-34 14 6 24 18 26 34Z`} fill="#3f6b52" opacity="0.85" />
      <path d={`M${cx} ${cy + 74}c18-4 30-20 26-34-14 6-24 18-26 34Z`} fill="#2f4a3a" opacity="0.85" />

      {/* Petals, back rings first so later (inner) rings overlap correctly */}
      {PETALS.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * p.radius;
        const y = cy + Math.sin(rad) * p.radius;
        // Petal art points "up" (-y); orient it outward from the bloom center.
        const orient = p.angle + 90 + p.rotate;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${orient}) scale(${p.scale})`}>
            <path d={PETAL_PATH} fill={RING_FILL[p.ring]} stroke="#5c2438" strokeWidth="0.6" strokeOpacity="0.25" />
            <path d={PETAL_FOLD} fill="#ffffff" opacity="0.16" />
          </g>
        );
      })}

      <circle cx={cx} cy={cy - 2} r="4" fill="#5c2438" opacity="0.5" />
    </svg>
  );
}
