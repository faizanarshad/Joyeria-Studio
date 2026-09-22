import { formatPKR } from "@/lib/format";
import { getOverviewStats, getRevenueTrend, getOrdersByStatus, getTopProducts } from "@/lib/analytics";
import VerticalBarChart from "@/components/admin/VerticalBarChart";
import HorizontalBarChart from "@/components/admin/HorizontalBarChart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };

// Fixed categorical order — validated for CVD/contrast as a set (dataviz skill
// reference palette). Never reassign a color when a status is filtered out.
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#2a78d6",
  CONFIRMED: "#eb6834",
  SHIPPED: "#1baf7a",
  DELIVERED: "#eda100",
  CANCELLED: "#e87ba4",
};

export default async function AnalyticsPage() {
  const [stats, revenueTrend, statusCounts, topProducts] = await Promise.all([
    getOverviewStats(),
    getRevenueTrend(14),
    getOrdersByStatus(),
    getTopProducts(5),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Analytics</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total revenue" value={formatPKR(stats.totalRevenue)} />
        <StatTile label="Orders" value={String(stats.totalOrders)} />
        <StatTile label="Avg. order value" value={formatPKR(stats.avgOrderValue)} />
        <StatTile label="Unique customers" value={String(stats.uniqueCustomers)} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-medium text-foreground">Revenue — last 14 days</h2>
          <p className="text-xs text-muted">Excludes cancelled orders.</p>
          <div className="mt-4">
            <VerticalBarChart
              data={revenueTrend.map((d) => ({ label: d.label, value: d.revenue }))}
              format="currency"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="font-medium text-foreground">Orders by status</h2>
          <p className="text-xs text-muted">All time.</p>
          <div className="mt-4">
            <HorizontalBarChart
              data={statusCounts.map((s) => ({
                label: s.status,
                value: s.count,
                color: STATUS_COLORS[s.status],
              }))}
              format="number"
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 lg:col-span-2">
          <h2 className="font-medium text-foreground">Top products by units sold</h2>
          <p className="text-xs text-muted">All time, across all orders.</p>
          <div className="mt-4">
            <HorizontalBarChart
              data={topProducts.map((p) => ({ label: p.name, value: p.quantity }))}
              format="sold"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-medium text-foreground">{value}</p>
    </div>
  );
}
