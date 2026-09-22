import { prisma } from "@/lib/prisma";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { formatPKR } from "@/lib/format";
import { saveDeliveryRate, deleteDeliveryRate } from "@/app/admin/delivery/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Delivery Rates" };

export default async function AdminDeliveryPage() {
  const rates = await prisma.deliveryRate.findMany({ orderBy: { city: "asc" } });

  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">Delivery Rates</h1>
      <p className="mt-1 text-sm text-muted">
        Orders at or above {formatPKR(FREE_DELIVERY_THRESHOLD)} always get free delivery, regardless of
        city — set that with the <code className="text-xs">FREE_DELIVERY_THRESHOLD</code> environment
        variable.
      </p>

      <div className="mt-6 space-y-2">
        {rates.map((rate) => (
          <form
            key={rate.id}
            action={saveDeliveryRate}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <input type="hidden" name="id" value={rate.id} />
            <input
              name="city"
              defaultValue={rate.city}
              required
              className="w-40 rounded-md border border-border px-2 py-1.5 text-sm"
            />
            <div className="flex items-center gap-1 text-sm text-muted">
              <span>Rs</span>
              <input
                name="fee"
                type="number"
                min={0}
                defaultValue={rate.fee}
                required
                className="w-24 rounded-md border border-border px-2 py-1.5 text-sm"
              />
            </div>
            <label className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={rate.isActive} />
              Active
            </label>
            <button type="submit" className="rounded-md bg-foreground px-3 py-1.5 text-sm text-white hover:bg-rose-dark">
              Save
            </button>
            <button
              type="submit"
              formAction={deleteDeliveryRate}
              className="text-sm text-muted hover:text-red-600"
            >
              Delete
            </button>
          </form>
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-border p-4">
        <p className="mb-2 text-sm font-medium text-foreground">Add a city</p>
        <form action={saveDeliveryRate} className="flex flex-wrap items-center gap-3">
          <input
            name="city"
            placeholder="City name"
            required
            className="w-40 rounded-md border border-border px-2 py-1.5 text-sm"
          />
          <div className="flex items-center gap-1 text-sm text-muted">
            <span>Rs</span>
            <input
              name="fee"
              type="number"
              min={0}
              defaultValue={250}
              required
              className="w-24 rounded-md border border-border px-2 py-1.5 text-sm"
            />
          </div>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" name="isActive" defaultChecked />
            Active
          </label>
          <button type="submit" className="rounded-md bg-foreground px-3 py-1.5 text-sm text-white hover:bg-rose-dark">
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
