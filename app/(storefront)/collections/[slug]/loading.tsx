export default function CollectionLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="h-9 w-56 shimmer rounded-md" />
      <div className="mt-3 h-4 w-80 max-w-full shimmer rounded-md" />

      <div className="mt-6 flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 shimmer rounded-full" />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-4/5 shimmer rounded-lg" />
            <div className="mt-3 h-3 w-16 shimmer rounded" />
            <div className="mt-2 h-4 w-32 shimmer rounded" />
            <div className="mt-2 h-4 w-20 shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
