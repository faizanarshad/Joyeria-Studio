"use client";

import { useState } from "react";
import { formatPKR } from "@/lib/format";
import { updateOrderStatus } from "@/app/admin/orders/actions";

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  total: number;
  status: string;
  courierName: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: { productName: string; quantity: number }[];
};

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
          </button>
          <p className="text-xs text-muted">
            {order.customerName} · {order.phone} · {order.city}
          </p>
        </div>
        <span className="text-sm font-medium text-rose-dark">{formatPKR(order.total)}</span>
      </div>

      {expanded && (
        <ul className="mt-2 text-xs text-foreground/80">
          {order.items.map((item, i) => (
            <li key={i}>
              {item.productName} x{item.quantity}
            </li>
          ))}
        </ul>
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
      </form>
    </div>
  );
}
