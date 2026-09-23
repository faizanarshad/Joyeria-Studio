import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../lib/slugify";

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

// One real, free-license Unsplash photo per category (verified: jewelry
// alone, no one wearing it — see each URL's own page for the photographer).
// "ring" and "tikka" have no verified match yet (a maang tikka in particular
// is worn on the forehead/hair part, so an unworn product shot is hard to
// find) and fall back to the plain-background line-art icon used before any
// of this was sourced — swap those for real photography via the admin once
// it's shot.
const CATEGORY_IMAGE: Record<string, { url: string } | null> = {
  earrings: { url: "https://images.unsplash.com/photo-1634390618228-2fe329fc7546?w=1000&q=80&auto=format&fit=crop" },
  necklace: { url: "https://images.unsplash.com/photo-1602527418517-f33773c47f8a?w=1000&q=80&auto=format&fit=crop" },
  bracelet: { url: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000&q=80&auto=format&fit=crop" },
  "bridal-set": { url: "https://images.unsplash.com/photo-1722410180687-b05b50922362?w=1000&q=80&auto=format&fit=crop" },
  ring: null,
  tikka: null,
};

const img = (category: "earrings" | "necklace" | "bracelet" | "ring" | "tikka" | "bridal-set", alt: string) => ({
  url: CATEGORY_IMAGE[category]?.url ?? `/products/${category}.svg`,
  alt,
});

const products: Array<{
  name: string;
  description: string;
  material: string;
  finish: string;
  careNote: string;
  price: number;
  compareAtPrice?: number;
  costPrice: number;
  stock: number;
  category: string;
  collectionSlug: string;
  isFeatured?: boolean;
  images: { url: string; alt: string }[];
}> = [
  {
    name: "Pearl Drop Earrings",
    description:
      "Dainty gold-plated earrings with a single freshwater pearl drop. Light enough for all-day wear, dressy enough for a dawaat.",
    material: "Pearl",
    finish: "Gold-plated",
    careNote: "Keep away from perfume and water. Store in a pouch.",
    price: 850,
    costPrice: 320,
    stock: 12,
    category: "Earrings",
    collectionSlug: "daily-wear",
    isFeatured: true,
    images: [img("earrings", "Pearl drop earrings on plain background")],
  },
  {
    name: "Minimalist Gold Hoops",
    description: "Small everyday hoops that don't tug at your ears. Our best-selling daily wear piece.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Avoid contact with water and perfume.",
    price: 650,
    costPrice: 220,
    stock: 20,
    category: "Earrings",
    collectionSlug: "daily-wear",
    images: [img("earrings", "Minimalist gold hoop earrings on plain background")],
  },
  {
    name: "Simple Chain Bracelet",
    description: "A thin gold-plated chain bracelet with an adjustable clasp — layers well with a watch.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Wipe with a dry cloth after wear.",
    price: 950,
    costPrice: 380,
    stock: 8,
    category: "Bracelets",
    collectionSlug: "daily-wear",
    images: [img("bracelet", "Bracelet on a dark reflective surface")],
  },
  {
    name: "Oxidized Stud Set",
    description: "Set of 3 oxidized silver studs for everyday mixing and matching.",
    material: "Oxidized Silver",
    finish: "Oxidized",
    careNote: "Store separately to prevent tarnishing.",
    price: 550,
    costPrice: 190,
    stock: 15,
    category: "Earrings",
    collectionSlug: "daily-wear",
    images: [img("earrings", "Oxidized silver stud earrings on plain background")],
  },
  {
    name: "Layered Chain Necklace",
    description: "Triple-layer gold-plated chain necklace — an easy way to dress up a plain kurta or western top.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Remove before sleeping or showering.",
    price: 1450,
    compareAtPrice: 1800,
    costPrice: 620,
    stock: 6,
    category: "Necklaces",
    collectionSlug: "western",
    isFeatured: true,
    images: [img("necklace", "Gold necklace displayed on neutral fabric")],
  },
  {
    name: "Statement Hoop Earrings",
    description: "Large gold-plated hoops that make a plain outfit look finished.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Avoid pulling by the hoop — hold the post when removing.",
    price: 1100,
    costPrice: 420,
    stock: 10,
    category: "Earrings",
    collectionSlug: "western",
    images: [img("earrings", "Large statement gold hoop earrings on plain background")],
  },
  {
    name: "Chunky Cuff Bracelet",
    description: "Open-back gold-plated cuff that fits most wrist sizes — a strong statement piece.",
    material: "Alloy",
    finish: "Gold-plated",
    careNote: "Gently squeeze to adjust fit, don't overbend.",
    price: 1350,
    costPrice: 540,
    stock: 5,
    category: "Bracelets",
    collectionSlug: "western",
    images: [img("bracelet", "Bracelet on a dark reflective surface")],
  },
  {
    name: "Crystal Drop Necklace",
    description: "Gold-plated necklace with a clear crystal drop pendant — catches the light beautifully at night events.",
    material: "Crystal",
    finish: "Gold-plated",
    careNote: "Keep dry, store flat to protect the stone setting.",
    price: 1650,
    costPrice: 700,
    stock: 7,
    category: "Necklaces",
    collectionSlug: "western",
    images: [img("necklace", "Gold necklace displayed on neutral fabric")],
  },
  {
    name: "Kundan Choker Set",
    description:
      "Traditional kundan choker with matching earrings — designed for mehendi and reception looks. Comes gift-boxed.",
    material: "Kundan",
    finish: "Gold-plated",
    careNote: "Handle stones gently, avoid direct spray of perfume.",
    price: 4500,
    compareAtPrice: 5200,
    costPrice: 1900,
    stock: 3,
    category: "Sets",
    collectionSlug: "bridal",
    isFeatured: true,
    images: [img("bridal-set", "Bridal necklace and earring set displayed on a mannequin bust")],
  },
  {
    name: "Polki Jhumka Earrings",
    description: "Statement polki jhumkas with pearl drops — a bridal party favorite.",
    material: "Polki",
    finish: "Gold-plated",
    careNote: "Store in the original box to protect the jhumka shape.",
    price: 3200,
    costPrice: 1350,
    stock: 4,
    category: "Earrings",
    collectionSlug: "bridal",
    images: [img("earrings", "Polki jhumka earrings on plain background")],
  },
  {
    name: "Bridal Maang Tikka",
    description: "Stone-studded maang tikka with an adjustable chain — pairs well with the Kundan Choker Set.",
    material: "Stone",
    finish: "Gold-plated",
    careNote: "Adjust the chain gently, avoid pulling on the pendant.",
    price: 2200,
    costPrice: 900,
    stock: 6,
    category: "Tikka",
    collectionSlug: "bridal",
    images: [img("tikka", "Bridal maang tikka on plain background")],
  },
  {
    name: "Emerald Stone Necklace Set",
    description:
      "Emerald-green stone necklace and earring set for bridal green/gold outfits. Limited stock — handmade in small batches.",
    material: "Stone",
    finish: "Gold-plated",
    careNote: "Keep away from moisture, store flat in the box provided.",
    price: 5200,
    costPrice: 2200,
    stock: 2,
    category: "Sets",
    collectionSlug: "bridal",
    isFeatured: true,
    images: [img("bridal-set", "Bridal necklace and earring set displayed on a mannequin bust")],
  },
];

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
    const slug = slugify(p.name);
    const collectionId = collectionRecords.get(p.collectionSlug);
    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name: p.name,
        description: p.description,
        material: p.material,
        finish: p.finish,
        careNote: p.careNote,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        costPrice: p.costPrice,
        stock: p.stock,
        category: p.category,
        collectionId,
        isActive: true,
        isFeatured: p.isFeatured ?? false,
      },
      create: {
        name: p.name,
        slug,
        description: p.description,
        material: p.material,
        finish: p.finish,
        careNote: p.careNote,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        costPrice: p.costPrice,
        stock: p.stock,
        category: p.category,
        collectionId,
        isActive: true,
        isFeatured: p.isFeatured ?? false,
      },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: p.images.map((image, i) => ({
        productId: product.id,
        url: image.url,
        alt: image.alt,
        isCover: i === 0,
        sortOrder: i,
      })),
    });
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
