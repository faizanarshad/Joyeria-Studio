import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Collections" };

export default async function AdminCollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Collections</h1>
        <Link
          href="/admin/collections/new"
          className="rounded-full bg-foreground px-4 py-2 text-sm text-white hover:bg-rose-dark"
        >
          + Add Collection
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Products</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Sort</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <Link href={`/admin/collections/${c.id}`} className="text-foreground hover:text-rose-dark">
                    {c.name}
                  </Link>
                </td>
                <td className="p-3 font-mono text-xs text-muted">{c.slug}</td>
                <td className="p-3">{c._count.products}</td>
                <td className="p-3">{c.featured ? "Yes" : "—"}</td>
                <td className="p-3">{c.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {collections.length === 0 && <p className="p-6 text-sm text-muted">No collections yet.</p>}
      </div>
    </div>
  );
}
