"use client";

import { useState } from "react";
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
      className="rounded-full border border-green px-4 py-1.5 text-xs text-green-dark hover:bg-green hover:text-white"
    >
      {added ? "Added ✓" : "Add to bag"}
    </button>
  );
}
