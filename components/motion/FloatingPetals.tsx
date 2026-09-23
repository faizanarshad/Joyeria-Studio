"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

type Petal = {
  id: number;
  kind: "rose" | "leaf";
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  depth: number; // translateZ, purely for parallax-scale depth cue
};

function makePetals(seed: number, count: number): Petal[] {
  // Deterministic pseudo-random so server and client render the same markup —
  // Math.random() here would desync during hydration.
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    kind: i % 3 === 0 ? "leaf" : "rose",
    left: `${Math.round(rand() * 92)}%`,
    top: `${Math.round(rand() * 85)}%`,
    size: 16 + Math.round(rand() * 20),
    duration: 10 + rand() * 8,
    delay: rand() * 6,
    drift: 14 + rand() * 18,
    depth: rand() * 60,
  }));
}

/** Ambient, low-opacity petals tumbling in genuine 3D (rotateX/Y/Z + translateZ
 * inside a perspective container, not a flat 2D fake). Decoration only — sits
 * behind content (negative z-index-ish via DOM order + pointer-events:none)
 * and never competes with text for attention. Use sparingly: emotionally-led
 * pages (hero sections, Our Story, the bridal callout), never on checkout,
 * cart or admin where the customer is trying to get something done. */
export default function FloatingPetals({
  count = 10,
  seed = 7,
  className = "",
}: {
  count?: number;
  seed?: number;
  className?: string;
}) {
  const petals = useMemo(() => makePetals(seed, count), [seed, count]);
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{ perspective: 900 }}
    >
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            transformStyle: "preserve-3d",
          }}
          initial={{ opacity: 0 }}
          animate={
            reducedMotion
              ? { opacity: 0.5 }
              : {
                  opacity: [0, 0.6, 0.6, 0],
                  y: [0, -p.drift, 0],
                  rotateX: [0, 180, 360],
                  rotateY: [0, 220, 360],
                  z: [0, p.depth, 0],
                }
          }
          transition={
            reducedMotion
              ? { duration: 0.6 }
              : {
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          {p.kind === "rose" ? <RosePetal /> : <GreenPetal />}
        </motion.div>
      ))}
    </div>
  );
}

function RosePetal() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full drop-shadow-sm">
      <path
        d="M16 2c6 3 10 8 10 14 0 7-5 13-10 14C11 29 6 23 6 16 6 10 10 5 16 2Z"
        fill="#d9b23c"
        opacity="0.85"
      />
      <path d="M16 6c3.5 2.2 6 5.6 6 10 0 4.8-3 9-6 9.6" stroke="#9c7d1e" strokeWidth="0.6" fill="none" opacity="0.5" />
    </svg>
  );
}

function GreenPetal() {
  return (
    <svg viewBox="0 0 32 32" className="h-full w-full drop-shadow-sm">
      <path
        d="M16 3c7 2 13 8 13 14s-6 12-13 12S3 23 3 17 9 5 16 3Z"
        fill="#4f7a5c"
        opacity="0.8"
      />
      <path d="M16 6v22" stroke="#2f4a3a" strokeWidth="0.6" opacity="0.5" />
    </svg>
  );
}
