"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPKR } from "@/lib/format";
import { updateOrderStatus } from "@/app/admin/orders/actions";

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  note: string | null;
  status: string;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: { productName: string; color: string | null; quantity: number; price: number }[];
};

const PAYMENT_LABEL: Record<string, string> = {
  COD: "Cash on Delivery",
  BANK_TRANSFER: "Bank Transfer",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
};

// Fixed zone so the server render and the browser agree, whatever either's clock is set to.
function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-left font-medium text-foreground hover:text-rose-dark"
          >
            {order.orderNumber}
            <span className="ml-2 text-xs font-normal text-muted">
              {expanded ? "Hide items" : `Show items (${order.items.length})`}
            </span>
          </button>
          <p className="text-xs text-muted">
            {order.customerName} · {order.phone} · {order.city}
          </p>
        </div>
        <span className="text-sm font-medium text-rose-dark">{formatPKR(order.total)}</span>
      </div>

      {/* Everything needed to pack and ship, visible without expanding. */}
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-xs text-muted sm:pt-0.5">Deliver to</dt>
        <dd className="whitespace-pre-line text-foreground">
          {order.address}, {order.city}
        </dd>
        <dt className="text-xs text-muted sm:pt-0.5">Payment</dt>
        <dd className="text-foreground">{PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}</dd>
        <dt className="text-xs text-muted sm:pt-0.5">Placed</dt>
        <dd className="text-foreground">{formatOrderDate(order.createdAt)}</dd>
        {order.note && (
          <>
            <dt className="text-xs text-muted sm:pt-0.5">Note</dt>
            <dd className="whitespace-pre-line text-foreground">{order.note}</dd>
          </>
        )}
      </dl>

      {expanded && (
        <div className="mt-3 max-w-md text-sm text-foreground/80">
          <ul>
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>
                  {item.productName}
                  {item.color ? ` (${item.color})` : ""} x{item.quantity}
                </span>
                <span>{formatPKR(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-border pt-1 text-xs text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPKR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{order.deliveryFee === 0 ? "Free" : formatPKR(order.deliveryFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span>Discount</span>
                <span>-{formatPKR(order.discount)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <form action={updateOrderStatus} className="mt-3 flex flex-wrap items-end gap-2">
        <input type="hidden" name="orderId" value={order.id} />
        <div>
          <label className="block text-xs text-muted">Status</label>
          <select
            name="status"
            defaultValue={order.status}
            className="rounded-md border border-border px-2 py-1.5 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted">Courier</label>
          <input
            name="courierName"
            defaultValue={order.courierName ?? ""}
            placeholder="TCS, Leopards..."
            className="w-28 rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-muted">Tracking #</label>
          <input
            name="trackingNumber"
            defaultValue={order.trackingNumber ?? ""}
            className="w-32 rounded-md border border-border px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-foreground px-4 py-1.5 text-sm text-white hover:bg-rose-dark"
        >
          Save
        </button>
        <Link
          href={`/admin/orders/${order.id}/label`}
          target="_blank"
          className="rounded-md border border-border px-4 py-1.5 text-sm text-foreground hover:border-foreground"
        >
          Print label
        </Link>
      </form>
    </div>
  );
}
