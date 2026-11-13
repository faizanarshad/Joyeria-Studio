import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import {
  VariantProvider,
  VariantGallery,
  ColorSwatches,
  VariantWhatsAppButton,
} from "@/components/ProductVariants";
import AddToCartControls from "@/components/AddToCartControls";
import ProductCard from "@/components/ProductCard";
import ProductPolicies from "@/components/ProductPolicies";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import ProductTryOnButton from "@/components/ProductTryOnButton";
import { tryOnPlacementFor } from "@/lib/tryon";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
      collection: true,
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    // Shared product links preview the product's own photo; the brand card
    // is the fallback when a product has no photo.
    openGraph: {
      type: "website",
      siteName: "Joyería Studio",
      locale: "en_PK",
      url: `/products/${slug}`,
      title: `${product.name} · Rs ${product.price.toLocaleString("en-PK")}`,
      description: product.description,
      images: product.images[0]
        ? [{ url: product.images[0].url, alt: product.images[0].alt || product.name }]
        : ["/og/joyeria-studio-share.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.description,
      images: [product.images[0]?.url ?? "/og/joyeria-studio-share.jpg"],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const tryOnPlacement = tryOnPlacementFor(product.category);

  const [related, reviews] = await Promise.all([
    product.collectionId
      ? prisma.product.findMany({
          where: {
            collectionId: product.collectionId,
            isActive: true,
            id: { not: product.id },
          },
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 2 },
            _count: { select: { variants: true } },
          },
          take: 4,
        })
      : Promise.resolve([]),
    prisma.review.findMany({
      where: { productId: product.id, isApproved: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    // Images can be site paths ("/products/x.jpg"); structured data needs absolute URLs.
    image: product.images.map((i) => new URL(i.url, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").href),
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(reviewCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: averageRating.toFixed(1),
        reviewCount,
      },
    }),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        // JSON.stringify doesn't escape "</script>" — an admin-entered product
        // name or description containing that literal string would close this
        // tag early and let arbitrary markup run. < keeps it valid JSON
        // (the string content is unchanged) while making it inert as HTML.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <VariantProvider
        variants={product.variants.map((v) => ({
          id: v.id,
          color: v.color,
          imageUrl: v.imageUrl,
          stock: v.stock,
        }))}
      >
        <div className="grid gap-10 lg:grid-cols-2">
          <VariantGallery images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} />

          <div>
            <h1 className="font-display text-3xl text-foreground">{product.name}</h1>

            {reviewCount > 0 && (
              <a href="#reviews" className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <span className="text-rose">{"★".repeat(Math.round(averageRating))}</span>
                <span>
                  {averageRating.toFixed(1)} ({reviewCount} review{reviewCount === 1 ? "" : "s"})
                </span>
              </a>
            )}

            <div className="mt-3 flex items-center gap-3">
              <span className="text-xl text-rose-dark">{formatPKR(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-sm text-muted line-through">
                  {formatPKR(product.compareAtPrice)}
                </span>
              )}
            </div>

            {product.variants.length === 0 && product.stock > 0 && product.stock <= 3 && (
              <p className="mt-2 text-sm text-rose-dark">Only {product.stock} left in stock</p>
            )}

            <ColorSwatches />

            <p className="mt-4 whitespace-pre-line text-sm text-foreground/80">
              {product.description}
            </p>

            <div className="mt-6 space-y-3">
              <AddToCartControls
                productId={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                image={product.images[0]?.url ?? "/placeholder-jewelry.svg"}
                stock={product.stock}
              />
              {tryOnPlacement && product.tryOnImageUrl && (
                <ProductTryOnButton
                  item={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    placement: tryOnPlacement,
                    overlayUrl: product.tryOnImageUrl,
                  }}
                />
              )}
              <VariantWhatsAppButton name={product.name} price={product.price} />
            </div>

            <dl className="mt-8 space-y-2 border-t border-border pt-6 text-sm">
              {product.material && (
                <div className="flex gap-2">
                  <dt className="w-24 text-muted">Material</dt>
                  <dd>{product.material}</dd>
                </div>
              )}
              {product.finish && (
                <div className="flex gap-2">
                  <dt className="w-24 text-muted">Finish</dt>
                  <dd>{product.finish}</dd>
                </div>
              )}
              {product.occasionTags.length > 0 && (
                <div className="flex gap-2">
                  <dt className="w-24 text-muted">Occasion</dt>
                  <dd>{product.occasionTags.join(", ")}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="w-24 text-muted">Delivery</dt>
                <dd>Ships in 2–4 business days.</dd>
              </div>
            </dl>

            <ProductPolicies careNote={product.careNote} />
          </div>
        </div>
      </VariantProvider>

      <section id="reviews" className="mx-auto mt-16 max-w-4xl scroll-mt-20">
        <h2 className="font-display text-2xl text-foreground">
          Reviews{reviewCount > 0 ? ` (${reviewCount})` : ""}
        </h2>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ReviewList
            reviews={reviews.map((r) => ({
              id: r.id,
              customerName: r.customerName,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.createdAt,
            }))}
          />
          <ReviewForm productId={product.id} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-foreground">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  price: p.price,
                  compareAtPrice: p.compareAtPrice,
                  stock: p.stock,
                  category: p.category,
                  hoverImage: p.images[1]?.url,
                  special: p.isFeatured,
                  coverImage: p.images[0]?.url ?? "/placeholder-jewelry.svg",
                  coverImageAlt: p.images[0]?.alt ?? p.name,
                  colorCount: p._count.variants || undefined,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
