import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    // Covers /admin/login — middleware already redirects unauthenticated
    // requests to every other /admin route here, so this is a plain pass-through.
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-rose-soft/30">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-display text-lg text-foreground">
              Joyería Studio Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin/orders" className="hover:text-rose">
                Orders
              </Link>
              <Link href="/admin/products" className="hover:text-rose">
                Products
              </Link>
            </nav>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button type="submit" className="text-sm text-muted hover:text-red-600">
              Sign Out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
