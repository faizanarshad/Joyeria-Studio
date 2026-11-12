import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { sectionHref, sectionsFor } from "@/lib/collection-sections";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [products, collections] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ select: { id: true, slug: true, updatedAt: true } }),
  ]);
  const sections = (
    await Promise.all(
      collections.map(async (c) => (await sectionsFor(c)).map((s) => ({ c, href: sectionHref(c.slug, s.slug) })))
    )
  ).flat();

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    ...collections.map((c) => ({
      url: `${siteUrl}/collections/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...sections.map(({ c, href }) => ({
      url: `${siteUrl}${href}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
    ...products.map((p) => ({
      url: `${siteUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
