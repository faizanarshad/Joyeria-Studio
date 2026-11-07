"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCartStore } from "@/lib/cart-store";
import { useSelectedVariant } from "@/components/ProductVariants";

export default function AddToCartControls({
  productId,
  slug,
  name,
  price,
  image: productImage,
  stock: productStock,
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

  // With colour options, stock and photo come from the chosen colour.
  const variant = useSelectedVariant()?.selected ?? null;
  const stock = variant ? variant.stock : productStock;
  const image = variant?.imageUrl ?? productImage;
  const line = { productId, slug, name, price, image, stock, variantId: variant?.id, color: variant?.color };

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
            addItem(line, Math.min(quantity, stock));
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          className="relative flex-1 overflow-hidden rounded-full bg-rose px-6 py-3 text-sm text-white hover:bg-rose-dark"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={added ? "added" : "add"}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="block"
            >
              {added ? "Added ✓" : "Add to Cart"}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
      <button
        onClick={() => {
          addItem(line, Math.min(quantity, stock));
          router.push("/cart");
        }}
        className="w-full rounded-full border border-green px-6 py-3 text-sm text-green-dark hover:bg-green hover:text-white"
      >
        Buy Now
      </button>
    </div>
  );
}
