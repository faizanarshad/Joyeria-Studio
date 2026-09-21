"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "@/lib/cart-store";

// The cart is persisted to localStorage, so its first render on the client
// won't match the server-rendered markup until zustand finishes rehydrating.
// useSyncExternalStore (rather than a manual effect + setState) is the
// React-endorsed way to subscribe to that external store's hydration status.
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (callback) => useCartStore.persist.onFinishHydration(callback),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );
}
