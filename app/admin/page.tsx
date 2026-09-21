import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pendingCount, todayOrders, lowStock] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { total: true },
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 3 } },
      select: { id: true, name: true, stock: true },
      orderBy: { stock: "asc" },
      take: 5,
    }),
  ]);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending Orders" value={String(pendingCount)} href="/admin/orders?status=PENDING" />
        <StatCard label="Orders Today" value={String(todayOrders.length)} href="/admin/orders" />
        <StatCard label="Revenue Today" value={formatPKR(todayRevenue)} />
      </div>

      <div className="mt-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="font-medium text-foreground">Low Stock</h2>
        {lowStock.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing below 3 units.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between">
                <Link href={`/admin/products/${p.id}`} className="hover:text-rose-dark">
                  {p.name}
                </Link>
                <span className="text-rose-dark">{p.stock} left</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-medium text-foreground">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
