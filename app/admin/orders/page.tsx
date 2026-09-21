import { prisma } from "@/lib/prisma";
import OrderRow from "@/components/admin/OrderRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const validStatus = STATUSES.includes(status as (typeof STATUSES)[number]) ? status : undefined;

  const orders = await prisma.order.findMany({
    where: validStatus ? { status: validStatus as (typeof STATUSES)[number] } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <a
          href="/admin/orders"
          className={`rounded-full border px-3 py-1.5 ${
            !validStatus ? "border-rose bg-rose text-white" : "border-border"
          }`}
        >
          All
        </a>
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full border px-3 py-1.5 ${
              validStatus === s ? "border-rose bg-rose text-white" : "border-border"
            }`}
          >
            {s}
          </a>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={{
              ...order,
              createdAt: order.createdAt.toISOString(),
            }}
          />
        ))}
        {orders.length === 0 && <p className="text-sm text-muted">No orders here yet.</p>}
      </div>
    </div>
  );
}
