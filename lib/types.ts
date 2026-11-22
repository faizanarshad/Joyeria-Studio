import type { OptionKind } from "@/lib/variant-colors";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  category: string | null;
  coverImage: string;
  coverImageAlt: string;
  /** Second product photo, if one exists — crossfades in on hover. */
  hoverImage?: string;
  /** Featured pieces get a subtle sparkle on hover. */
  special?: boolean;
  /** Number of colour options — when set, the card sends shoppers to pick one instead of adding to bag. */
  colorCount?: number;
  /** Whether those options are colours or designs; decides the card's wording. */
  optionKind?: OptionKind;
};
