import { prisma } from "@/lib/prisma";

const CANCELLED = "CANCELLED";

export type DailyRevenue = { date: string; label: string; revenue: number };
export type StatusCount = { status: string; count: number };
export type TopProduct = { name: string; slug: string | null; quantity: number; revenue: number };

export async function getOverviewStats() {
  const [orders, distinctPhones] = await Promise.all([
    prisma.order.findMany({
      where: { status: { not: CANCELLED } },
      select: { total: true },
    }),
    prisma.order.findMany({ distinct: ["phone"], select: { phone: true } }),
  ]);

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    uniqueCustomers: distinctPhones.length,
  };
}

/** Revenue for each of the last `days` days, oldest first — bucketed in JS since
 * the dataset is small enough that a raw date-truncation query isn't worth it.
 *
 * Bucketing is done entirely in UTC calendar days. Mixing local-time date
 * arithmetic (setDate/setHours) with UTC-based keys (toISOString) shifts the
 * whole window by a day on any server with a positive UTC offset — the
 * generated bucket for "today" silently becomes yesterday's date string.
 * Staying in UTC throughout (generation, aggregation and the display label)
 * sidesteps that; the day boundary is UTC midnight rather than the store's
 * local midnight, which is a fine trade for an internal chart. */
export async function getRevenueTrend(days = 14): Promise<DailyRevenue[]> {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const startUTC = todayUTC - (days - 1) * 86_400_000;

  const orders = await prisma.order.findMany({
    where: { status: { not: CANCELLED }, createdAt: { gte: new Date(startUTC) } },
    select: { total: true, createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const key = new Date(startUTC + i * 86_400_000).toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const order of orders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + order.total);
  }

  return Array.from(buckets.entries()).map(([date, revenue]) => ({
    date,
    label: new Date(`${date}T00:00:00Z`).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }),
    revenue,
  }));
}

export async function getOrdersByStatus(): Promise<StatusCount[]> {
  const grouped = await prisma.order.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const order = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
  const map = new Map<string, number>(grouped.map((g) => [g.status, g._count._all]));

  return order.map((status) => ({ status, count: map.get(status) ?? 0 }));
}

export async function getTopProducts(limit = 5): Promise<TopProduct[]> {
  const items = await prisma.orderItem.findMany({
    select: {
      productId: true,
      productName: true,
      quantity: true,
      price: true,
      product: { select: { name: true, slug: true } },
    },
  });

  // Keyed by productId when the product still exists, not by the snapshotted
  // name — OrderItem.productName is frozen at purchase time on purpose (see
  // schema), so renaming a product would otherwise split its history into
  // two separate rows here, one per name it's ever had. Orphaned items
  // (productId null — the product was deleted) fall back to grouping by
  // name, same as before.
  const totals = new Map<string, TopProduct>();
  for (const item of items) {
    const key = item.productId ?? item.productName;
    const displayName = item.product?.name ?? item.productName;
    const existing = totals.get(key);
    if (existing) {
      existing.quantity += item.quantity;
      existing.revenue += item.price * item.quantity;
    } else {
      totals.set(key, {
        name: displayName,
        slug: item.product?.slug ?? null,
        quantity: item.quantity,
        revenue: item.price * item.quantity,
      });
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
}
