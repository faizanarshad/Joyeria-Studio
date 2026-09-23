"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "motion/react";

/** A real photograph that tilts in genuine 3D (perspective + rotateX/rotateY)
 * as the cursor moves across it, with a matching drop shadow — the restrained,
 * "premium product shot" version of 3D, not the continuous spin used
 * elsewhere. See PhotoAccent for why an actual photo is never set spinning:
 * a bounded, cursor-driven tilt reads as considered; a rose rotating forever
 * on its own reads as a gimmick. Falls back to a plain static image under
 * prefers-reduced-motion. */
export default function TiltPhoto({
  src,
  alt,
  className = "",
  objectPosition = "center",
}: {
  src: string;
  alt: string;
  className?: string;
  objectPosition?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  // Bounded to a few degrees either way — enough to read as depth, not a toy.
  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-6, 6]);
  const shadowX = useTransform(springX, [-0.5, 0.5], [12, -12]);
  const shadowY = useTransform(springY, [-0.5, 0.5], [-8, 16]);
  const boxShadow = useTransform(
    [shadowX, shadowY],
    ([sx, sy]: number[]) => `${sx}px ${sy}px 30px -10px rgba(0,0,0,0.35)`
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  if (reducedMotion) {
    return (
      <div className={`relative overflow-hidden rounded-2xl shadow-xl ${className}`}>
        <Image src={src} alt={alt} fill sizes="480px" className="object-cover" style={{ objectPosition }} />
      </div>
    );
  }

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{
          rotateX,
          rotateY,
          boxShadow,
          transformStyle: "preserve-3d",
        }}
        className="relative aspect-4/5 overflow-hidden rounded-2xl"
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="480px"
          className="object-cover"
          style={{ objectPosition }}
        />
      </motion.div>
    </div>
  );
}
