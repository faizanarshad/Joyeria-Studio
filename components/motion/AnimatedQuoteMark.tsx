"use client";

import { motion } from "motion/react";

/** Large decorative quotation mark for the pull-quote section. Responds to
 * hover/tap (a small tilt + scale) — the one place on the site a purely
 * decorative glyph, rather than a product photo, gets to be playful. */
export default function AnimatedQuoteMark({ className = "" }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
      whileInView={{ opacity: 1, scale: 1, rotate: -6 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.12, rotate: 4 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`pointer-events-auto inline-block select-none font-display italic text-rose ${className}`}
      style={{ lineHeight: 0.6 }}
    >
      &ldquo;
    </motion.span>
  );
}
