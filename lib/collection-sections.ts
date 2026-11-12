import { prisma } from "@/lib/prisma";
import { sortCategories } from "@/lib/categories";
import { tabsFor, type CollectionTab } from "@/lib/collection-tabs";

// Every collection category has its own page at /collections/<collection>/<section>,
// e.g. /collections/western/rings or /collections/bridal/heavy-sets.
// Collections with custom tabs (Bridal) use those as their sections; the others
// get one section per jewelry type their products carry (Rings, Earrings…).

export function sectionSlug(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function sectionHref(collectionSlug: string, section: string): string {
  return `/collections/${collectionSlug}/${section}`;
}

type CollectionRef = { id: string; slug: string };

export async function sectionsFor(collection: CollectionRef): Promise<CollectionTab[]> {
  const tabs = tabsFor(collection.slug);
  if (tabs.length > 0) return tabs;

  const rows = await prisma.product.findMany({
    where: { collectionId: collection.id, isActive: true, category: { not: null } },
    distinct: ["category"],
    select: { category: true },
  });
  return sortCategories(rows.map((r) => r.category!)).map((category) => ({
    slug: sectionSlug(category),
    label: category,
    where: { category },
  }));
}

export async function resolveSection(
  collection: CollectionRef,
  slug: string
): Promise<CollectionTab | null> {
  const tab = tabsFor(collection.slug).find((t) => t.slug === slug);
  if (tab) return tab;
  return (await sectionsFor(collection)).find((s) => s.slug === slug) ?? null;
}
