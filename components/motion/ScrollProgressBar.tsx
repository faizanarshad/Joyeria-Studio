"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin bar at the very top tracking scroll position through the page —
 * most noticeable on long collection/product listings. */
export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 300, damping: 40, mass: 0.2 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-50 h-[2px] w-full origin-left bg-rose"
    />
  );
}
