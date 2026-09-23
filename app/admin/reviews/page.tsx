import { prisma } from "@/lib/prisma";
import { toggleReviewApproval, deleteReview } from "@/app/admin/reviews/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    include: { product: { select: { name: true, slug: true } } },
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
  });

  const pendingCount = reviews.filter((r) => !r.isApproved).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-foreground">Reviews</h1>
        {pendingCount > 0 && (
          <span className="rounded-full bg-rose/10 px-3 py-1 text-xs text-rose-dark">
            {pendingCount} awaiting approval
          </span>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs text-muted">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Reviewer</th>
              <th className="p-3">Comment</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b border-border align-top last:border-0">
                <td className="p-3">{r.product.name}</td>
                <td className="p-3 whitespace-nowrap text-rose">{"★".repeat(r.rating)}</td>
                <td className="p-3">{r.customerName}</td>
                <td className="max-w-xs p-3 text-foreground/80">{r.comment}</td>
                <td className="p-3 whitespace-nowrap">
                  {r.createdAt.toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-3">
                  <form action={toggleReviewApproval}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="isApproved" value={String(r.isApproved)} />
                    <input type="hidden" name="productSlug" value={r.product.slug} />
                    <button
                      type="submit"
                      className={`rounded-full px-2 py-1 text-xs ${
                        r.isApproved ? "bg-green/10 text-green-dark" : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {r.isApproved ? "Approved" : "Pending"}
                    </button>
                  </form>
                </td>
                <td className="p-3">
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="productSlug" value={r.product.slug} />
                    <button type="submit" className="text-xs text-muted hover:text-red-600">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && <p className="p-6 text-sm text-muted">No reviews yet.</p>}
      </div>
    </div>
  );
}
