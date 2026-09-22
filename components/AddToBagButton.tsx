"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useCartStore } from "@/lib/cart-store";

export default function AddToBagButton({
  productId,
  slug,
  name,
  price,
  image,
  stock,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  if (stock === 0) {
    return (
      <button disabled className="rounded-full border border-border px-4 py-1.5 text-xs text-muted">
        Sold Out
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        // ProductCard wraps this in a <Link> — stop the click from also navigating.
        e.preventDefault();
        e.stopPropagation();
        addItem({ productId, slug, name, price, image, stock }, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className="relative flex h-[26px] w-[88px] items-center justify-center overflow-hidden rounded-full border border-green text-xs text-green-dark hover:bg-green hover:text-white"
    >
      <AnimatePresence mode="wait" initial={false}>
        {added ? (
          <motion.span
            key="added"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-1"
          >
            <CheckIcon className="h-3 w-3" /> Added
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            Add to bag
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12l6 6L20 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
