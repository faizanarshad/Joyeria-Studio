"use client";

import { useActionState, useState } from "react";
import { submitReview, type ReviewFormState } from "@/app/(storefront)/products/[slug]/actions";

export default function ReviewForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState<ReviewFormState, FormData>(submitReview, {});
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hpConfirm, setHpConfirm] = useState(""); // honeypot

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  if (state.success) {
    return (
      <p className="rounded-lg bg-green-soft p-4 text-sm text-green-dark">
        Thanks for your review — it&apos;ll appear here once we&apos;ve approved it.
      </p>
    );
  }

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />

      {/* Honeypot: real users never see or fill this. */}
      <input
        type="text"
        name="hp_confirm"
        value={hpConfirm}
        onChange={(e) => setHpConfirm(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
        tabIndex={-1}
        aria-hidden="true"
        autoComplete="off"
      />

      <div>
        <span className="mb-1 block text-sm font-medium text-foreground">Your Rating</span>
        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className={`text-2xl leading-none ${
                (hoverRating || rating) >= n ? "text-rose" : "text-border"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        {err("rating") && <span className="mt-1 block text-xs text-red-600">{err("rating")}</span>}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">Your Name</span>
        <input name="customerName" required className="input" />
        {err("customerName") && (
          <span className="mt-1 block text-xs text-red-600">{err("customerName")}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-foreground">Your Review</span>
        <textarea name="comment" required rows={4} className="input" />
        {err("comment") && <span className="mt-1 block text-xs text-red-600">{err("comment")}</span>}
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-foreground px-6 py-3 text-sm text-white hover:bg-rose-dark disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit Review"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.6rem 0.8rem;
          font-size: 0.875rem;
          background: var(--surface);
        }
      `}</style>
    </form>
  );
}
