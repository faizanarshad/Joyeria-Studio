"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { collectionSchema, type CollectionInput } from "@/lib/validation";

export type CollectionFormState = { error?: string; fieldErrors?: Record<string, string[]> };

function parseCollectionForm(formData: FormData) {
  return collectionSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    coverImage: formData.get("coverImage") ?? "",
    featured: formData.get("featured") === "on",
    sortOrder: formData.get("sortOrder") || 0,
  });
}

async function assertUnique(slug: string, excludeId?: string) {
  const existing = await prisma.collection.findFirst({
    where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  return !existing;
}

function toData(input: CollectionInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    coverImage: input.coverImage || null,
    featured: input.featured,
    sortOrder: input.sortOrder,
  };
}

export async function createCollection(
  _prevState: CollectionFormState,
  formData: FormData
): Promise<CollectionFormState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = parseCollectionForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!(await assertUnique(parsed.data.slug))) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: ["This slug is already in use"] } };
  }

  await prisma.collection.create({ data: toData(parsed.data) });

  revalidatePath("/admin/collections");
  revalidatePath("/", "layout");
  redirect("/admin/collections");
}

export async function updateCollection(
  collectionId: string,
  _prevState: CollectionFormState,
  formData: FormData
): Promise<CollectionFormState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = parseCollectionForm(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  if (!(await assertUnique(parsed.data.slug, collectionId))) {
    return { error: "Please fix the errors below.", fieldErrors: { slug: ["This slug is already in use"] } };
  }

  await prisma.collection.update({ where: { id: collectionId }, data: toData(parsed.data) });

  revalidatePath("/admin/collections");
  revalidatePath("/", "layout");
  return {};
}

export async function deleteCollection(collectionId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  // Products keep their own name/price/category — unsetting collectionId here
  // never touches an order's history (OrderItem only ever snapshots the product).
  await prisma.product.updateMany({ where: { collectionId }, data: { collectionId: null } });
  await prisma.collection.delete({ where: { id: collectionId } });

  revalidatePath("/admin/collections");
  revalidatePath("/", "layout");
  redirect("/admin/collections");
}
