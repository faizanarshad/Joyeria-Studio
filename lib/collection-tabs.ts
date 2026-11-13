import type { Prisma } from "@prisma/client";

// Category tabs shown at the top of a collection page. Each tab is a filter
// over fields products already have (occasion tags, type), so a new product
// lands in the right tab from the admin form without any extra setup.
export type CollectionTab = {
  slug: string;
  label: string;
  where: Prisma.ProductWhereInput;
};

const TABS: Record<string, CollectionTab[]> = {
  bridal: [
    { slug: "mehndi", label: "Mehndi", where: { occasionTags: { has: "Mehndi" } } },
    { slug: "party-wear", label: "Party Wear", where: { occasionTags: { has: "Party Wear" } } },
    // Full wedding sets; lighter sets also tagged Party Wear belong under that tab instead.
    {
      slug: "heavy-sets",
      label: "Heavy Sets",
      where: { category: "Sets", occasionTags: { has: "Wedding" }, NOT: { occasionTags: { has: "Party Wear" } } },
    },
    { slug: "heavy-jhumkay", label: "Heavy Jhumkay", where: { category: "Earrings" } },
    { slug: "golden-bangles", label: "Golden Bangles", where: { category: "Bangles" } },
    { slug: "rings", label: "Rings", where: { category: "Rings" } },
  ],
};

export function tabsFor(collectionSlug: string): CollectionTab[] {
  return TABS[collectionSlug] ?? [];
}
