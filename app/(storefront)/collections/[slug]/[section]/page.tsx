import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CollectionListing from "@/components/CollectionListing";
import { resolveSection } from "@/lib/collection-sections";

export const revalidate = 300;

// A collection category's own page, e.g. /collections/western/rings.
type Props = {
  params: Promise<{ slug: string; section: string }>;
  searchParams: Promise<{ sort?: string }>;
};

async function load(slug: string, sectionSlug: string) {
  const collection = await prisma.collection.findUnique({ where: { slug } });
  if (!collection) return null;
  const section = await resolveSection(collection, sectionSlug);
  return section ? { collection, section } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, section } = await params;
  const found = await load(slug, section);
  if (!found) return {};
  return {
    title: `${found.section.label} · ${found.collection.name}`,
    description: `Shop ${found.section.label.toLowerCase()} from the ${found.collection.name} collection at Joyería Studio.`,
  };
}

export default async function CollectionSectionPage({ params, searchParams }: Props) {
  const { slug, section } = await params;
  const { sort } = await searchParams;
  const found = await load(slug, section);
  if (!found) notFound();
  return <CollectionListing collection={found.collection} section={found.section} sort={sort} />;
}
