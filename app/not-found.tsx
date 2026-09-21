import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-3xl text-foreground">Page Not Found</h1>
      <p className="mt-2 text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm text-white hover:bg-rose-dark"
      >
        Back to Shop
      </Link>
    </div>
  );
}
