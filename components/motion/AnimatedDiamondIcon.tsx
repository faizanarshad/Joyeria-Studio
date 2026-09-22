"use client";

import { motion } from "motion/react";

/** A diamond outline that draws itself in (stroke-dasharray reveal) the first
 * time it scrolls into view — used only for the icon fallback shown when a
 * product/collection has no photo yet. */
export default function AnimatedDiamondIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <motion.path
        d="M6 3h12l4 6-10 12L2 9l4-6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: "easeInOut" }}
      />
      <motion.path
        d="M2 9h20M8 3l4 6 4-6M12 21 9 9M12 21l3-12"
        stroke="currentColor"
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.5, ease: "easeInOut" }}
      />
    </svg>
  );
}
