"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { productSchema } from "@/lib/validation";
import { slugify } from "@/lib/slugify";

function parseImages(formData: FormData): { url: string; alt: string }[] {
  const urls = formData.getAll("imageUrl") as string[];
  const alts = formData.getAll("imageAlt") as string[];
  return urls
    .map((url, i) => ({ url: url.trim(), alt: (alts[i] ?? "").trim() }))
    .filter((img) => img.url.length > 0);
}

function parseVariants(formData: FormData): { color: string; stock: string; imageUrl: string }[] {
  const colors = formData.getAll("variantColor") as string[];
  const stocks = formData.getAll("variantStock") as string[];
  const images = formData.getAll("variantImage") as string[];
  return colors
    .map((color, i) => ({ color: color.trim(), stock: stocks[i] ?? "0", imageUrl: (images[i] ?? "").trim() }))
    .filter((v) => v.color.length > 0);
}

// With colour options, the product's own stock is the total across colours.
function totalStock(data: { stock: number; variants: { stock: number }[] }): number {
  return data.variants.length > 0 ? data.variants.reduce((sum, v) => sum + v.stock, 0) : data.stock;
}

function parseProductForm(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  return productSchema.safeParse({
    name,
    slug: String(formData.get("slug") ?? slugify(name)),
    description: String(formData.get("description") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    material: String(formData.get("material") ?? ""),
    finish: String(formData.get("finish") ?? ""),
    careNote: String(formData.get("careNote") ?? ""),
    category: String(formData.get("category") ?? ""),
    occasionTags: formData.getAll("occasionTags") as string[],
    colorTags: formData.getAll("colorTags") as string[],
    tryOnImageUrl: String(formData.get("tryOnImageUrl") ?? ""),
    collectionId: String(formData.get("collectionId") ?? ""),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || null,
    costPrice: formData.get("costPrice") || null,
    stock: formData.get("stock"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    images: parseImages(formData),
    variants: parseVariants(formData),
  });
}

export type ProductFormState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function createProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.product.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { slug: ["A product with this slug already exists"] },
    };
  }

  if (parsed.data.sku) {
    const existingSku = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existingSku) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: { sku: ["A product with this item code already exists"] },
      };
    }
  }

  const { images, variants, ...data } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...data,
      stock: totalStock(parsed.data),
      sku: data.sku || null,
      material: data.material || null,
      finish: data.finish || null,
      careNote: data.careNote || null,
      category: data.category || null,
      tryOnImageUrl: data.tryOnImageUrl || null,
      compareAtPrice: data.compareAtPrice || null,
      costPrice: data.costPrice ?? null,
      images: {
        create: images.map((img, i) => ({
          url: img.url,
          alt: img.alt,
          isCover: i === 0,
          sortOrder: i,
        })),
      },
      variants: {
        create: variants.map((v, i) => ({
          color: v.color,
          stock: v.stock,
          imageUrl: v.imageUrl || null,
          sortOrder: i,
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(
  productId: string,
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.product.findFirst({
    where: { slug: parsed.data.slug, id: { not: productId } },
  });
  if (existing) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { slug: ["A product with this slug already exists"] },
    };
  }

  if (parsed.data.sku) {
    const existingSku = await prisma.product.findFirst({
      where: { sku: parsed.data.sku, id: { not: productId } },
    });
    if (existingSku) {
      return {
        error: "Please fix the errors below.",
        fieldErrors: { sku: ["A product with this item code already exists"] },
      };
    }
  }

  const { images, variants, ...data } = parsed.data;
  const current = await prisma.product.findUnique({ where: { id: productId } });
  if (!current) return { error: "Product not found" };

  await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        stock: totalStock(parsed.data),
        sku: data.sku || null,
        material: data.material || null,
        finish: data.finish || null,
        careNote: data.careNote || null,
        category: data.category || null,
        tryOnImageUrl: data.tryOnImageUrl || null,
        compareAtPrice: data.compareAtPrice || null,
        costPrice: data.costPrice ?? null,
      },
    }),
    // Colours are matched by name and upserted rather than recreated, so an
    // existing colour keeps its id and past orders can still restock it.
    prisma.productVariant.deleteMany({
      where: { productId, color: { notIn: variants.map((v) => v.color) } },
    }),
    ...variants.map((v, i) =>
      prisma.productVariant.upsert({
        where: { productId_color: { productId, color: v.color } },
        create: { productId, color: v.color, stock: v.stock, imageUrl: v.imageUrl || null, sortOrder: i },
        update: { stock: v.stock, imageUrl: v.imageUrl || null, sortOrder: i },
      })
    ),
    prisma.productImage.deleteMany({ where: { productId } }),
    prisma.productImage.createMany({
      data: images.map((img, i) => ({
        productId,
        url: img.url,
        alt: img.alt,
        isCover: i === 0,
        sortOrder: i,
      })),
    }),
  ]);

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");

  return { error: undefined };
}

export async function deleteProduct(productId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Order history keeps its own snapshot (OrderItem.productName/price), and
  // productId there is nullable, so deleting here never touches past orders.
  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  redirect("/admin/products");
}
