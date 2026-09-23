"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useCartHydrated } from "@/lib/use-cart-hydrated";
import { formatPKR } from "@/lib/format";

type PaymentMethod = "COD" | "BANK_TRANSFER" | "JAZZCASH" | "EASYPAISA";

export default function CheckoutForm({
  cities,
  freeDeliveryThreshold,
  advancePaymentThreshold,
}: {
  cities: { city: string; fee: number }[];
  freeDeliveryThreshold: number;
  advancePaymentThreshold: number;
}) {
  const router = useRouter();
  const { items, subtotal, clear } = useCartStore();
  const mounted = useCartHydrated();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState(cities[0]?.city ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [note, setNote] = useState("");
  const [hpConfirm, setHpConfirm] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseDeliveryFee = cities.find((c) => c.city === city)?.fee ?? cities[0]?.fee ?? 250;
  const freeDelivery = subtotal() >= freeDeliveryThreshold;
  const deliveryFee = freeDelivery ? 0 : baseDeliveryFee;
  const total = subtotal() + deliveryFee;
  const codAllowed = total < advancePaymentThreshold;

  // Derived, not stored: if the cart grows past the threshold while COD is
  // selected, this is what actually gets submitted and styled as "selected"
  // — no need to sync `paymentMethod` itself via an effect. The server
  // re-checks the same rule on the real, re-priced total regardless.
  const effectivePaymentMethod = !codAllowed && paymentMethod === "COD" ? "BANK_TRANSFER" : paymentMethod;

  if (!mounted) return null;

  if (items.length === 0) {
    return <p className="mt-10 text-muted">Your cart is empty. Add something before checking out.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          customerName,
          phone,
          address,
          city,
          paymentMethod: effectivePaymentMethod,
          note,
          hp_confirm: hpConfirm,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      clear();
      router.push(`/checkout/success/${data.orderNumber}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-10 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Honeypot: real users never see or fill this. Off-screen rather than
            display:none — some autofill tools still fill display:none inputs
            that match common field-name heuristics, which "website" did. */}
        <input
          type="text"
          name="hp_confirm"
          value={hpConfirm}
          onChange={(e) => setHpConfirm(e.target.value)}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
          tabIndex={-1}
          aria-hidden="true"
          autoComplete="off"
        />

        <Field label="Full Name">
          <input
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Phone Number" hint="03XXXXXXXXX">
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="03001234567"
            className="input"
          />
        </Field>
        <Field label="Delivery Address">
          <textarea
            required
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="City">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city} — {formatPKR(c.fee)} delivery
              </option>
            ))}
          </select>
        </Field>
        <Field label="Payment Method">
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["COD", "Cash on Delivery"],
                ["BANK_TRANSFER", "Bank Transfer"],
                ["JAZZCASH", "JazzCash"],
                ["EASYPAISA", "Easypaisa"],
              ] as [PaymentMethod, string][]
            ).map(([value, label]) => {
              const disabled = value === "COD" && !codAllowed;
              return (
                <button
                  type="button"
                  key={value}
                  disabled={disabled}
                  onClick={() => setPaymentMethod(value)}
                  className={`rounded-md border px-3 py-2 text-left text-sm ${
                    disabled
                      ? "cursor-not-allowed border-border text-muted opacity-50"
                      : effectivePaymentMethod === value
                        ? "border-rose bg-rose/10"
                        : "border-border"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {!codAllowed ? (
            <p className="mt-2 text-xs text-muted">
              Orders of {formatPKR(advancePaymentThreshold)} or more need advance payment — cash
              on delivery isn&apos;t available above that. Account details will be shared on
              WhatsApp after you place the order — send a screenshot of the transfer to confirm.
            </p>
          ) : (
            paymentMethod !== "COD" && (
              <p className="mt-2 text-xs text-muted">
                Account details will be shared on WhatsApp after you place the order — send a
                screenshot of the transfer to confirm.
              </p>
            )
          )}
        </Field>
        <Field label="Order Note (optional)">
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="h-fit space-y-2 rounded-lg border border-border p-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span>{formatPKR(subtotal())}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Delivery ({city || "select city"})</span>
          {freeDelivery ? (
            <span className="text-green-dark">Free</span>
          ) : (
            <span>{formatPKR(deliveryFee)}</span>
          )}
        </div>
        {!freeDelivery && (
          <p className="text-xs text-muted">
            Add {formatPKR(freeDeliveryThreshold - subtotal())} more for free delivery.
          </p>
        )}
        <div className="flex justify-between border-t border-border pt-2 text-base font-medium">
          <span>Total</span>
          <span>{formatPKR(total)}</span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-green px-6 py-3 text-sm text-white hover:bg-green-dark disabled:opacity-60"
        >
          {submitting ? "Placing Order..." : "Place Order"}
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.6rem 0.8rem;
          font-size: 0.875rem;
          background: var(--surface);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">
        {label} {hint && <span className="font-normal text-muted">({hint})</span>}
      </span>
      {children}
    </label>
  );
}
