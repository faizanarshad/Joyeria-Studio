import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import catalog from "./catalog.json";

// tsx doesn't load .env, and without it ADMIN_EMAIL/ADMIN_PASSWORD below fall
// back to the defaults — so a fresh database would get a "changeme123" admin.
// Variables already set (e.g. by the host) take precedence over the file.
try {
  process.loadEnvFile();
} catch {
  // No .env file — rely on the environment as-is.
}

const prisma = new PrismaClient();

const collections = [
  {
    name: "Daily Wear",
    slug: "daily-wear",
    description: "Lightweight, everyday pieces that go with everything.",
    featured: true,
    sortOrder: 1,
  },
  {
    name: "Western",
    slug: "western",
    description: "Bold statement pieces for going out.",
    featured: true,
    sortOrder: 2,
  },
  {
    name: "Bridal",
    slug: "bridal",
    description: "Kundan, polki and stone sets for the big day.",
    featured: true,
    sortOrder: 3,
  },
];

// The live catalogue: every product with its photos, tags and colour options.
// Photos with a site path ("/products/...") ship in public/products/. To
// refresh this file from a database after editing products in the admin,
// run `npm run db:export-catalog` (prisma/export-catalog.ts).
type CatalogProduct = {
  name: string;
  slug: string;
  sku: string | null;
  collectionSlug: string | null;
  category: string | null;
  description: string;
  material: string | null;
  finish: string | null;
  careNote: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stock: number;
  occasionTags: string[];
  colorTags: string[];
  tryOnImageUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  images: { url: string; alt: string }[];
  variants: { color: string; imageUrl: string | null; stock: number }[];
};

const products = catalog as CatalogProduct[];

const deliveryRates = [
  { city: "Karachi", fee: 200 },
  { city: "Lahore", fee: 200 },
  { city: "Islamabad", fee: 200 },
  { city: "Rawalpindi", fee: 250 },
  { city: "Faisalabad", fee: 300 },
  { city: "Multan", fee: 300 },
  { city: "Peshawar", fee: 300 },
  { city: "Other", fee: 350 },
];

async function main() {
  console.log("Seeding collections...");
  const collectionRecords = new Map<string, string>();
  for (const c of collections) {
    const record = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    collectionRecords.set(c.slug, record.id);
  }

  console.log("Seeding delivery rates...");
  for (const rate of deliveryRates) {
    await prisma.deliveryRate.upsert({
      where: { city: rate.city },
      update: { fee: rate.fee },
      create: rate,
    });
  }

  console.log("Seeding coupon...");
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      discountType: "PERCENT",
      value: 10,
      minOrderValue: 1000,
      usageLimit: 100,
      isActive: true,
    },
  });

  console.log("Seeding products...");
  for (const p of products) {
    const { images, variants, collectionSlug, slug, ...fields } = p;
    const data = {
      ...fields,
      collectionId: collectionSlug ? collectionRecords.get(collectionSlug) ?? null : null,
      // With colour options, the product's stock is their total.
      stock: variants.length > 0 ? variants.reduce((sum, v) => sum + v.stock, 0) : p.stock,
    };
    const product = await prisma.product.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: images.map((image, i) => ({
        productId: product.id,
        url: image.url,
        alt: image.alt,
        isCover: i === 0,
        sortOrder: i,
      })),
    });

    // Colours are upserted by name rather than recreated, so an existing
    // colour keeps its id and past orders can still restock it.
    await prisma.productVariant.deleteMany({
      where: { productId: product.id, color: { notIn: variants.map((v) => v.color) } },
    });
    for (const [i, v] of variants.entries()) {
      await prisma.productVariant.upsert({
        where: { productId_color: { productId: product.id, color: v.color } },
        update: { imageUrl: v.imageUrl, stock: v.stock, sortOrder: i },
        create: { productId: product.id, color: v.color, imageUrl: v.imageUrl, stock: v.stock, sortOrder: i },
      });
    }
  }

  console.log(`Seeded ${products.length} products across ${collections.length} collections.`);

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@joyeriastudio.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: "Admin",
    },
  });
  console.log(`Seeded admin user: ${adminEmail} / ${adminPassword} (change this password!)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
