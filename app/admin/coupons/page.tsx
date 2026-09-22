import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import { toggleCoupon, deleteCoupon } from "@/app/admin/coupons/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons" };

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Coupons</h1>
        <Link
          href="/admin/coupons/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm text-white hover:bg-rose-dark"
        >
          + Add Coupon
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Min. Order</th>
              <th className="p-3">Used</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.discountType === "PERCENT" ? `${c.value}%` : formatPKR(c.value)}</td>
                <td className="p-3">{c.minOrderValue ? formatPKR(c.minOrderValue) : "—"}</td>
                <td className="p-3">
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="p-3">
                  {c.expiresAt
                    ? new Date(c.expiresAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </td>
                <td className="p-3">
                  <form action={toggleCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="isActive" value={String(c.isActive)} />
                    <button
                      type="submit"
                      className={`rounded-full px-2 py-1 text-xs ${
                        c.isActive ? "bg-green/10 text-green-dark" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </form>
                </td>
                <td className="p-3">
                  <form action={deleteCoupon}>
                    <input type="hidden" name="id" value={c.id} />
                    <button type="submit" className="text-xs text-muted hover:text-red-600">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-6 text-sm text-muted">No coupons yet.</p>}
      </div>
    </div>
  );
}
