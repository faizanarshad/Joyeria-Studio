import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, collection: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm text-white hover:bg-rose-dark"
        >
          + Add Product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Collection</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="text-foreground hover:text-rose-dark">
                    {p.name}
                  </Link>
                </td>
                <td className="p-3 text-muted">{p.collection?.name ?? "—"}</td>
                <td className="p-3">{formatPKR(p.price)}</td>
                <td className={`p-3 ${p.stock <= 3 ? "text-rose-dark" : ""}`}>{p.stock}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      p.isActive ? "bg-green/10 text-green-dark" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {p.isActive ? "Active" : "Draft"}
                  </span>
                  {p.isFeatured && (
                    <span className="ml-1 rounded-full bg-rose/10 px-2 py-1 text-xs text-rose-dark">
                      Featured
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-sm text-muted">No products yet.</p>}
      </div>
    </div>
  );
}
