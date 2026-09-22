"use client";

import { motion, useReducedMotion } from "motion/react";

/** A small cluster of delicate line-art flowers, gently rotating in real 3D
 * (rotateY/rotateX inside a perspective container — the foreshortening as
 * they turn is genuine, not simulated). Matches the site's existing icon
 * language (thin strokes, minimal fill — see the category/placeholder art)
 * rather than a solid-colored illustrated bloom, which read as clip-art. */
export default function ElegantFlorals3D({
  size = 260,
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
      style={{ width: size, height: size, perspective: 1100 }}
    >
      <motion.div
        style={{ width: "100%", height: "100%", transformStyle: "preserve-3d" }}
        initial={{ rotateY: -10, rotateX: 4 }}
        animate={
          reducedMotion
            ? { rotateY: -10, rotateX: 4 }
            : { rotateY: [-10, 10, -10], rotateX: [4, -3, 4] }
        }
        transition={
          reducedMotion
            ? undefined
            : {
                rotateY: { duration: 14, repeat: Infinity, ease: "easeInOut" },
                rotateX: { duration: 10, repeat: Infinity, ease: "easeInOut" },
              }
        }
      >
        <FloralCluster />
      </motion.div>
    </div>
  );
}

function Flower({
  cx,
  cy,
  r,
  stroke,
  petals = 5,
}: {
  cx: number;
  cy: number;
  r: number;
  stroke: string;
  petals?: number;
}) {
  const items = Array.from({ length: petals });
  return (
    <g>
      {items.map((_, i) => {
        const angle = (360 / petals) * i;
        return (
          <ellipse
            key={i}
            cx={cx}
            cy={cy - r * 0.62}
            rx={r * 0.4}
            ry={r * 0.62}
            fill="none"
            stroke={stroke}
            strokeWidth="1.4"
            transform={`rotate(${angle} ${cx} ${cy})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.16} fill={stroke} opacity="0.7" />
    </g>
  );
}

function FloralCluster() {
  return (
    <svg viewBox="0 0 220 220" className="h-full w-full">
      {/* stems */}
      <path d="M120 200 C122 170 118 140 128 118" stroke="#4f7a5c" strokeWidth="1.3" fill="none" opacity="0.6" />
      <path d="M158 210 C156 182 162 150 150 128" stroke="#4f7a5c" strokeWidth="1.3" fill="none" opacity="0.6" />
      {/* leaves */}
      <path d="M124 155c-14 2-22 12-22 24 13-3 20-13 22-24Z" fill="none" stroke="#4f7a5c" strokeWidth="1.2" opacity="0.6" />
      <path d="M150 168c14 1 24 10 25 22-14-2-22-11-25-22Z" fill="none" stroke="#4f7a5c" strokeWidth="1.2" opacity="0.6" />

      {/* three flowers, staggered depth via translateZ-like scale/position */}
      <g style={{ transformOrigin: "128px 118px" }} transform="translate(0,0)">
        <Flower cx={128} cy={118} r={40} stroke="#a8506b" />
      </g>
      <g>
        <Flower cx={150} cy={128} r={26} stroke="#c1607a" />
      </g>
      <g>
        <Flower cx={104} cy={140} r={19} stroke="#8a3d56" petals={6} />
      </g>
    </svg>
  );
}
