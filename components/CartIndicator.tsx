"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useCartStore } from "@/lib/cart-store";
import { useCartHydrated } from "@/lib/use-cart-hydrated";

export default function CartIndicator() {
  const totalItems = useCartStore((s) => s.totalItems());
  const mounted = useCartHydrated();
  const prevCount = useRef(totalItems);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (mounted && totalItems > prevCount.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 350);
      return () => clearTimeout(t);
    }
    prevCount.current = totalItems;
  }, [totalItems, mounted]);

  return (
    <motion.div animate={bump ? { scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.35 }}>
      <Link
        href="/cart"
        className="relative flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-rose"
      >
        Cart
        {mounted && totalItems > 0 && (
          <AnimatePresence mode="popLayout">
            <motion.span
              key={totalItems}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-xs text-white"
            >
              {totalItems}
            </motion.span>
          </AnimatePresence>
        )}
      </Link>
    </motion.div>
  );
}
