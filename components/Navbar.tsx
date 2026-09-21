import Link from "next/link";
import CartIndicator from "@/components/CartIndicator";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";

export default async function Navbar() {
  const collections = await prisma.collection
    .findMany({
      where: { featured: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
      select: { name: true, slug: true },
    })
    .catch(() => []);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-green px-4 py-2 text-center text-xs text-white sm:px-6">
        Cash on delivery available · Free delivery on orders above {formatPKR(FREE_DELIVERY_THRESHOLD)}
      </div>
      <div className="border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
          <Link href="/" className="font-display text-xl tracking-wide text-foreground">
            Joyería <span className="text-xs tracking-[0.3em] text-muted">STUDIO</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-foreground/80 md:flex">
            {collections.map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="hover:text-rose">
                {c.name}
              </Link>
            ))}
            <Link href="/track-order" className="hover:text-rose">
              Track Order
            </Link>
          </nav>

          <CartIndicator />
        </div>
      </div>
    </header>
  );
}
