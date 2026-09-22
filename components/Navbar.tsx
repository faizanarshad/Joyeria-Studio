import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const collections = await prisma.collection
    .findMany({
      where: { featured: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
      select: { name: true, slug: true },
    })
    .catch(() => []);

  const links = [
    ...collections.map((c) => ({ href: `/collections/${c.slug}`, label: c.name })),
    { href: "/our-story", label: "Our Story" },
    { href: "/track-order", label: "Track Order" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-green px-4 py-2 text-center text-xs text-white sm:px-6">
        Cash on delivery available · Free delivery on orders above {formatPKR(FREE_DELIVERY_THRESHOLD)}
      </div>
      <NavbarClient links={links} />
    </header>
  );
}
