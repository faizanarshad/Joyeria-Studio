"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function Gallery({
  images,
}: {
  images: { url: string; alt: string }[];
}) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const shown = images.length > 0 ? images : [{ url: "/placeholder-jewelry.svg", alt: "Product image" }];

  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoomed(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoomed]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setZoomed(true)}
        className="relative block aspect-4/5 w-full cursor-zoom-in overflow-hidden rounded-lg bg-rose-soft"
        aria-label="Zoom image"
      >
        <Image
          src={shown[active].url}
          alt={shown[active].alt}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </button>
      {shown.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {shown.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-md border transition-colors ${
                i === active ? "border-rose" : "border-border"
              }`}
            >
              <Image src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setZoomed(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full max-h-[85vh] w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={shown[active].url}
                alt={shown[active].alt}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </motion.div>
            <button
              onClick={() => setZoomed(false)}
              aria-label="Close"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
