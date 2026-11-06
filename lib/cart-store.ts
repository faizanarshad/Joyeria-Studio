"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  // Set when the product has colour options — the same product in two colours
  // is two separate cart lines.
  variantId?: string;
  color?: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
};

// Identifies a cart line: a product, or one colour of a product.
export function cartLineKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
}

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (lineKey: string) => void;
  setQuantity: (lineKey: string, quantity: number) => void;
  clear: () => void;
  subtotal: () => number;
  totalItems: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, quantity = 1) => {
        set((state) => {
          const key = cartLineKey(item);
          const existing = state.items.find((i) => cartLineKey(i) === key);
          if (existing) {
            const nextQty = Math.min(existing.quantity + quantity, item.stock);
            return {
              items: state.items.map((i) =>
                cartLineKey(i) === key ? { ...i, quantity: nextQty } : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(quantity, item.stock) }],
          };
        });
      },
      removeItem: (lineKey) =>
        set((state) => ({ items: state.items.filter((i) => cartLineKey(i) !== lineKey) })),
      setQuantity: (lineKey, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) => (cartLineKey(i) === lineKey ? { ...i, quantity } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: "joyeria-cart" }
  )
);
