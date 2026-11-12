import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CollectionListing from "@/components/CollectionListing";
import { resolveSection, sectionHref, sectionSlug } from "@/lib/collection-sections";

export const revalidate = 300;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    // Older links filtered the collection page; they now redirect to the category page.
    category?: string;
    tab?: string;
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
  const { sort, category, tab } = await searchParams;

  const collection = await getCollection(slug);
  if (!collection) notFound();

  const legacy = tab ?? (category ? sectionSlug(category) : undefined);
  if (legacy) {
    const section = await resolveSection(collection, legacy);
    if (section) {
      const query = sort ? `?sort=${encodeURIComponent(sort)}` : "";
      permanentRedirect(sectionHref(slug, section.slug) + query);
    }
  }

  return <CollectionListing collection={collection} section={null} sort={sort} />;
}
