function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="text-rose">
      {"★".repeat(rating)}
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export type ReviewItem = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
};

export default function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted">No reviews yet — be the first to write one.</p>;
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => (
        <li key={review.id} className="border-b border-border pb-6 last:border-0">
          <div className="flex items-center justify-between">
            <Stars rating={review.rating} />
            <span className="text-xs text-muted">
              {new Date(review.createdAt).toLocaleDateString("en-PK", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">{review.customerName}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
