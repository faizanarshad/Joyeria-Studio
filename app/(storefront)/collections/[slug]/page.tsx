import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import PriceFilterPopover from "@/components/PriceFilterPopover";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    material?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
};

async function getCollection(slug: string) {
  return prisma.collection.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description ?? `Shop ${collection.name} at Joyería Studio.`,
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sort, material, minPrice: minPriceParam, maxPrice: maxPriceParam } = await searchParams;

  const collection = await getCollection(slug);
  if (!collection) notFound();

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
        ? { price: "desc" as const }
        : { createdAt: "desc" as const };

  const [priceBounds, materials] = await Promise.all([
    prisma.product.aggregate({
      where: { collectionId: collection.id, isActive: true },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.product.findMany({
      where: { collectionId: collection.id, isActive: true, material: { not: null } },
      select: { material: true },
      distinct: ["material"],
    }),
  ]);

  const bounds = {
    min: priceBounds._min.price ?? 0,
    max: priceBounds._max.price ?? 0,
  };

  // Only honor a price param that's a real number within the collection's
  // actual range — anything else is treated as "no filter" rather than
  // silently clamped, so a stray/tampered query string can't hide products.
  const minPrice = parseBoundedPrice(minPriceParam, bounds);
  const maxPrice = parseBoundedPrice(maxPriceParam, bounds);

  const products = await prisma.product.findMany({
    where: {
      collectionId: collection.id,
      isActive: true,
      ...(material ? { material } : {}),
      ...(minPrice !== null || maxPrice !== null
        ? {
            price: {
              ...(minPrice !== null ? { gte: minPrice } : {}),
              ...(maxPrice !== null ? { lte: maxPrice } : {}),
            },
          }
        : {}),
    },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 2 } },
    orderBy,
  });

  const otherParams = { sort, material };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">{collection.name}</h1>
      {collection.description && (
        <p className="mt-2 max-w-2xl text-muted">{collection.description}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <FilterLink slug={slug} sort={sort} material={material} minPrice={minPriceParam} maxPrice={maxPriceParam} label="All" clearMaterial />
        {materials.map(
          (m) =>
            m.material && (
              <FilterLink
                key={m.material}
                slug={slug}
                sort={sort}
                material={m.material}
                minPrice={minPriceParam}
                maxPrice={maxPriceParam}
                label={m.material}
              />
            )
        )}

        {bounds.max > bounds.min && (
          <PriceFilterPopover
            basePath={`/collections/${slug}`}
            bounds={bounds}
            currentMin={minPrice}
            currentMax={maxPrice}
            otherParams={otherParams}
          />
        )}

        <span className="ml-auto flex gap-2">
          <SortLink slug={slug} material={material} minPrice={minPriceParam} maxPrice={maxPriceParam} sort="price-asc" label="Price: Low to High" />
          <SortLink slug={slug} material={material} minPrice={minPriceParam} maxPrice={maxPriceParam} sort="price-desc" label="Price: High to Low" />
        </span>
      </div>

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
            }}
          />
        ))}
      </div>

      {products.length === 0 && (
        <p className="mt-10 text-sm text-muted">
          No products match these filters.{" "}
          <a href={`/collections/${slug}`} className="text-rose hover:underline">
            Clear filters
          </a>
        </p>
      )}
    </div>
  );
}

function parseBoundedPrice(
  raw: string | undefined,
  bounds: { min: number; max: number }
): number | null {
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (value < bounds.min || value > bounds.max) return null;
  return value;
}

function FilterLink({
  slug,
  sort,
  material,
  minPrice,
  maxPrice,
  label,
  clearMaterial,
}: {
  slug: string;
  sort?: string;
  material?: string;
  minPrice?: string;
  maxPrice?: string;
  label: string;
  clearMaterial?: boolean;
}) {
  const params = new URLSearchParams();
  if (sort) params.set("sort", sort);
  if (!clearMaterial && material) params.set("material", material);
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  const active = clearMaterial ? !material : material === label;
  return (
    <a
      href={`/collections/${slug}?${params.toString()}`}
      className={`rounded-full border px-3 py-1.5 ${
        active ? "border-rose bg-rose text-white" : "border-border text-foreground/80"
      }`}
    >
      {label}
    </a>
  );
}

function SortLink({
  slug,
  material,
  minPrice,
  maxPrice,
  sort,
  label,
}: {
  slug: string;
  material?: string;
  minPrice?: string;
  maxPrice?: string;
  sort: string;
  label: string;
}) {
  const params = new URLSearchParams();
  params.set("sort", sort);
  if (material) params.set("material", material);
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  return (
    <a href={`/collections/${slug}?${params.toString()}`} className="text-muted hover:text-rose">
      {label}
    </a>
  );
}
