"use client";

import Image from "next/image";
import { motion } from "motion/react";

/** A real photograph, framed as a soft circular accent with a gentle fade +
 * scale entrance. Deliberately static/no continuous motion — the tumbling
 * 3D treatment used elsewhere suits flat icon illustrations, but rotating an
 * actual photograph in 3D reads as a gimmick, not a product shot. */
export default function PhotoAccent({
  src,
  alt,
  size = 240,
  objectPosition = "center",
  className = "",
}: {
  src: string;
  alt: string;
  size?: number;
  /** Where the subject sits in the source photo — a tall shot with the
   * bloom at the top needs "top" or a circular crop centers on the stem. */
  objectPosition?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-full shadow-xl ring-4 ring-white/70 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        style={{ objectPosition }}
      />
    </motion.div>
  );
}
