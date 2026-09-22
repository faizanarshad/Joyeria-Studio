"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/format";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  city: string;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: { id: string; productName: string; quantity: number; price: number }[];
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending Confirmation",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function TrackOrderPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrders(null);
    try {
      const res = await fetch(`/api/track-order?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setOrders(data.orders);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">Track Your Order</h1>
      <p className="mt-2 text-sm text-muted">
        Enter the phone number you used at checkout to see your order status.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="03001234567"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-foreground px-5 py-2 text-sm text-white hover:bg-rose-dark disabled:opacity-60"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {orders && orders.length === 0 && (
        <p className="mt-6 text-sm text-muted">No orders found for this phone number.</p>
      )}

      <div className="mt-6 space-y-4">
        {orders?.map((order) => (
          <div key={order.id} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{order.orderNumber}</span>
              <span className="rounded-full bg-rose/10 px-3 py-1 text-xs text-rose-dark">
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              {new Date(order.createdAt).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              · {order.city}
            </p>
            <ul className="mt-2 text-sm text-foreground/80">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.productName} x{item.quantity}
                </li>
              ))}
            </ul>
            {order.trackingNumber && (
              <p className="mt-2 text-xs text-muted">
                {order.courierName ?? "Courier"} tracking: {order.trackingNumber}
              </p>
            )}
            <p className="mt-2 text-sm font-medium">{formatPKR(order.total)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
