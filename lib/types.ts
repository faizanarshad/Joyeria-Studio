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
};
