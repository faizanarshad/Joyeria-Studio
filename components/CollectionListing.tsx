import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import CollectionFilters from "@/components/CollectionFilters";
import type { CollectionTab } from "@/lib/collection-tabs";
import { sectionHref } from "@/lib/collection-sections";

type Props = {
  collection: { id: string; slug: string; name: string; description: string | null };
  // A category page (e.g. Western → Rings); null for the whole collection.
  section: CollectionTab | null;
  sort?: string;
};

// The product grid shared by a collection page and its category pages.
export default async function CollectionListing({ collection, section, sort }: Props) {
  const basePath = section ? sectionHref(collection.slug, section.slug) : `/collections/${collection.slug}`;

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const products = await prisma.product.findMany({
    where: {
      collectionId: collection.id,
      isActive: true,
      ...(section ? { AND: [section.where] } : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 2 },
      _count: { select: { variants: true } },
    },
    orderBy,
  });

  const sortChips = [
    { label: "Newest", href: basePath, active: sort !== "price-asc" && sort !== "price-desc" },
    { label: "Price ↑", href: `${basePath}?sort=price-asc`, active: sort === "price-asc" },
    { label: "Price ↓", href: `${basePath}?sort=price-desc`, active: sort === "price-desc" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {section ? (
        <>
          <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.2em] text-muted">
            <Link href={`/collections/${collection.slug}`} className="hover:text-rose">
              {collection.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{section.label}</span>
          </nav>
          <h1 className="mt-2 font-display text-3xl text-foreground">{section.label}</h1>
          <p className="mt-2 text-sm text-muted">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
            <span className="mx-2">·</span>
            <Link href={`/collections/${collection.slug}`} className="text-rose hover:underline">
              See all {collection.name}
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl text-foreground">{collection.name}</h1>
          {collection.description && <p className="mt-2 max-w-2xl text-muted">{collection.description}</p>}
        </>
      )}

      <CollectionFilters sortChips={sortChips} />

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              stock: product.stock,
              category: product.category,
              hoverImage: product.images[1]?.url,
              special: product.isFeatured,
              coverImage: product.images[0]?.url ?? "/placeholder-jewelry.svg",
              coverImageAlt: product.images[0]?.alt ?? product.name,
              colorCount: product._count.variants || undefined,
            }}
          />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-10 text-sm text-muted">
          {section ? `New ${section.label.toLowerCase()} pieces are coming soon.` : "New pieces are coming soon."}{" "}
          {section && (
            <Link href={`/collections/${collection.slug}`} className="text-rose hover:underline">
              See all {collection.name}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
