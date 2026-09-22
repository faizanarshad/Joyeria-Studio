import type { Metadata } from "next";
import { Jost, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "../globals.css";
import { auth, signOut } from "@/lib/auth";

const sans = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Joyería Studio Admin" },
  robots: { index: false, follow: false },
};

// Admin gets its own root layout (its own <html>/<body>) rather than nesting
// under the storefront's — otherwise the storefront's announcement bar, nav
// and chat widget would render on top of the admin dashboard too, since a
// nested layout can't opt out of its parent. See the (storefront) route
// group for the customer-facing equivalent of this file.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {!session ? (
          // Covers /admin/login — middleware already redirects unauthenticated
          // requests to every other /admin route here, so this is a plain pass-through.
          <div className="min-h-screen bg-background">{children}</div>
        ) : (
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
        )}
      </body>
    </html>
  );
}
