import { prisma } from "@/lib/prisma";
import type { StyleProduct } from "@/lib/outfit-style";
import StyleMyOutfitClient from "@/components/StyleMyOutfitClient";

export const revalidate = 300;

export const metadata = {
  title: "Style My Outfit",
  description: "Pick the occasion, upload your outfit, and find jewelry that matches both.",
};

export default async function StyleMyOutfitPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      category: true,
      material: true,
      finish: true,
      isFeatured: true,
      tryOnImageUrl: true,
      occasionTags: true,
      colorTags: true,
      collection: { select: { slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      _count: { select: { variants: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const styleProducts: StyleProduct[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    category: p.category,
    material: p.material,
    finish: p.finish,
    isFeatured: p.isFeatured,
    tryOnImageUrl: p.tryOnImageUrl,
    coverImage: p.images[0]?.url ?? "/placeholder-jewelry.svg",
    coverImageAlt: p.images[0]?.alt ?? p.name,
    collectionSlug: p.collection?.slug ?? null,
    occasionTags: p.occasionTags,
    colorTags: p.colorTags,
    colorCount: p._count.variants || undefined,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Style My Outfit</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">Match it before you wear it</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Upload a photo of your outfit. We&apos;ll read its colours and how dressy it is, and suggest jewellery to
          match. You can also just pick the occasion yourself.
        </p>
      </div>

      <div className="mt-8">
        <StyleMyOutfitClient products={styleProducts} />
      </div>
    </div>
  );
}
