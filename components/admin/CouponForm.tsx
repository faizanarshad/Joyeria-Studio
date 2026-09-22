"use client";

import { useActionState, useState } from "react";
import { createCoupon, type CouponFormState } from "@/app/admin/coupons/actions";

export default function CouponForm() {
  const [state, formAction, isPending] = useActionState<CouponFormState, FormData>(createCoupon, {});
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="Code" error={err("code")}>
        <input name="code" required placeholder="WELCOME10" className="input font-mono uppercase" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Discount Type">
          <select
            name="discountType"
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "PERCENT" | "FIXED")}
            className="input"
          >
            <option value="PERCENT">Percent (%)</option>
            <option value="FIXED">Fixed (PKR)</option>
          </select>
        </Field>
        <Field label={discountType === "PERCENT" ? "Percent Off" : "Amount Off (PKR)"} error={err("value")}>
          <input name="value" type="number" min={1} required className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Min. Order Value (optional)">
          <input name="minOrderValue" type="number" min={0} className="input" />
        </Field>
        <Field label="Usage Limit (optional)">
          <input name="usageLimit" type="number" min={1} className="input" />
        </Field>
      </div>

      <Field label="Expires On (optional)">
        <input name="expiresAt" type="date" className="input" />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked />
        Active
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-foreground px-6 py-3 text-sm text-white hover:bg-rose-dark disabled:opacity-60"
      >
        {isPending ? "Creating..." : "Create Coupon"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          background: var(--surface);
        }
      `}</style>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
