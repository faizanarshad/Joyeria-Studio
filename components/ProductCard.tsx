import Image from "next/image";
import Link from "next/link";
import { formatPKR } from "@/lib/format";
import type { ProductCardData } from "@/lib/types";
import AddToBagButton from "@/components/AddToBagButton";

export default function ProductCard({ product }: { product: ProductCardData }) {
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="group">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-rose-soft">
          <Image
            src={product.coverImage}
            alt={product.coverImageAlt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
          {onSale && (
            <span className="absolute left-2 top-2 rounded-full bg-rose px-2 py-1 text-xs text-white">
              Sale
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white">
              Sold Out
            </span>
          )}
        </div>
      </Link>
      <div className="mt-3 space-y-1">
        {product.category && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            {product.category}
          </p>
        )}
        <Link href={`/products/${product.slug}`} className="block text-sm text-foreground">
          {product.name}
        </Link>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-rose">{formatPKR(product.price)}</span>
            {onSale && (
              <span className="text-xs text-muted line-through">
                {formatPKR(product.compareAtPrice!)}
              </span>
            )}
          </div>
          <AddToBagButton
            productId={product.id}
            slug={product.slug}
            name={product.name}
            price={product.price}
            image={product.coverImage}
            stock={product.stock}
          />
        </div>
      </div>
    </div>
  );
}
