"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";

export default function AddToCartControls({
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
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  if (stock === 0) {
    return (
      <button
        disabled
        className="w-full rounded-full bg-border px-6 py-3 text-sm text-muted"
      >
        Sold Out
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-border">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-2 text-foreground"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            className="px-3 py-2 text-foreground"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <button
          onClick={() => {
            addItem({ productId, slug, name, price, image, stock }, quantity);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          className="flex-1 rounded-full bg-rose px-6 py-3 text-sm text-white hover:bg-rose-dark"
        >
          {added ? "Added ✓" : "Add to Cart"}
        </button>
      </div>
      <button
        onClick={() => {
          addItem({ productId, slug, name, price, image, stock }, quantity);
          router.push("/cart");
        }}
        className="w-full rounded-full border border-green px-6 py-3 text-sm text-green-dark hover:bg-green hover:text-white"
      >
        Buy Now
      </button>
    </div>
  );
}
