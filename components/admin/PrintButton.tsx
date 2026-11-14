"use client";

export default function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-foreground px-4 py-2 text-sm text-white hover:bg-rose-dark"
    >
      {children}
    </button>
  );
}
