import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

// Writes the database's products (photos, tags, colour options) to
// prisma/catalog.json, which `npm run db:seed` loads. Run it after editing the
// catalogue in the admin so the repo — and any database seeded from it —
// matches.
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the environment as-is.
}

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      collection: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ collection: { sortOrder: "asc" } }, { createdAt: "asc" }],
  });

  const catalog = products.map((p) => ({
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    collectionSlug: p.collection?.slug ?? null,
    category: p.category,
    description: p.description,
    material: p.material,
    finish: p.finish,
    careNote: p.careNote,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    costPrice: p.costPrice,
    stock: p.stock,
    occasionTags: p.occasionTags,
    colorTags: p.colorTags,
    tryOnImageUrl: p.tryOnImageUrl,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    variants: p.variants.map((v) => ({ color: v.color, imageUrl: v.imageUrl, stock: v.stock })),
  }));

  writeFileSync("prisma/catalog.json", JSON.stringify(catalog, null, 2) + "\n");
  console.log(`Exported ${catalog.length} products to prisma/catalog.json.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
