"use client";

import Image from "next/image";
import Link from "next/link";
import { cartLineKey, useCartStore } from "@/lib/cart-store";
import { useCartHydrated } from "@/lib/use-cart-hydrated";
import { formatPKR } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal } = useCartStore();
  const mounted = useCartHydrated();

  if (!mounted) return null;

  const whatsappMessage =
    items.length > 0
      ? `Hi! I'd like to order:\n${items
          .map(
            (i) =>
              `- ${i.name}${i.color ? ` (${i.color})` : ""} x${i.quantity} (${formatPKR(i.price * i.quantity)})`
          )
          .join("\n")}\n\nTotal: ${formatPKR(subtotal())}`
      : "Hi! I'd like to place an order.";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">Your Cart</h1>

      {items.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-muted">Your cart is empty.</p>
          <Link href="/" className="mt-4 inline-block text-rose-dark hover:underline">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div key={cartLineKey(item)} className="flex gap-4 border-b border-border pb-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-rose-soft">
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between">
                    <div>
                      <Link href={`/products/${item.slug}`} className="text-sm text-foreground">
                        {item.name}
                      </Link>
                      {item.color && <p className="text-xs text-muted">Colour: {item.color}</p>}
                    </div>
                    <button
                      onClick={() => removeItem(cartLineKey(item))}
                      className="text-xs text-muted hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-full border border-border">
                      <button
                        onClick={() => setQuantity(cartLineKey(item), item.quantity - 1)}
                        className="px-3 py-1"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          setQuantity(cartLineKey(item), Math.min(item.stock, item.quantity + 1))
                        }
                        className="px-3 py-1"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-medium text-rose-dark">
                      {formatPKR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-lg border border-border p-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span>{formatPKR(subtotal())}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Delivery fee calculated at checkout.</p>

            <Link
              href="/checkout"
              className="mt-6 block rounded-full bg-foreground px-6 py-3 text-center text-sm text-white hover:bg-rose-dark"
            >
              Checkout
            </Link>
            <a
              href={buildWhatsAppLink(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-full bg-[#25D366] px-6 py-3 text-center text-sm text-white hover:brightness-95"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
