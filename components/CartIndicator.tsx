"use client";

import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { useCartHydrated } from "@/lib/use-cart-hydrated";

export default function CartIndicator() {
  const totalItems = useCartStore((s) => s.totalItems());
  const mounted = useCartHydrated();

  return (
    <Link
      href="/cart"
      className="relative flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:border-rose"
    >
      Cart
      {mounted && totalItems > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-xs text-white">
          {totalItems}
        </span>
      )}
    </Link>
  );
}
