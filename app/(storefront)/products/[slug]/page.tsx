import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import { productWhatsAppMessage } from "@/lib/whatsapp";
import Gallery from "@/components/Gallery";
import AddToCartControls from "@/components/AddToCartControls";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProductCard from "@/components/ProductCard";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

async function getProduct(slug: string) {
  return prisma.product.findUnique({
    where: { slug, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" } }, collection: true },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = product.collectionId
    ? await prisma.product.findMany({
        where: {
          collectionId: product.collectionId,
          isActive: true,
          id: { not: product.id },
        },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        take: 4,
      })
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <Gallery images={product.images.map((i) => ({ url: i.url, alt: i.alt }))} />

        <div>
          <h1 className="font-display text-3xl text-foreground">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xl text-rose-dark">{formatPKR(product.price)}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-muted line-through">
                {formatPKR(product.compareAtPrice)}
              </span>
            )}
          </div>

          {product.stock > 0 && product.stock <= 3 && (
            <p className="mt-2 text-sm text-rose-dark">Only {product.stock} left in stock</p>
          )}

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
            <WhatsAppButton
              message={productWhatsAppMessage(product.name, product.price)}
              className="w-full"
            />
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
            {product.careNote && (
              <div className="flex gap-2">
                <dt className="w-24 text-muted">Care</dt>
                <dd>{product.careNote}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="w-24 text-muted">Delivery</dt>
              <dd>Cash on delivery available. Ships in 2–4 business days.</dd>
            </div>
          </dl>
        </div>
      </div>

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
                  coverImage: p.images[0]?.url ?? "/placeholder-jewelry.svg",
                  coverImageAlt: p.images[0]?.alt ?? p.name,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
