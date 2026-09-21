import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { ProductCardData } from "@/lib/types";

export const revalidate = 300;

const OCCASIONS = [
  { name: "Everyday", collectionSlug: "daily-wear" },
  { name: "Office", collectionSlug: "daily-wear" },
  { name: "Mehndi", collectionSlug: "bridal" },
  { name: "Nikkah", collectionSlug: "bridal" },
];

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    category: p.category,
    coverImage: p.images[0]?.url ?? "/placeholder-jewelry.svg",
    coverImageAlt: p.images[0]?.alt ?? p.name,
  }));
}

async function getCollectionsWithCover() {
  const collections = await prisma.collection.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return collections.map((c) => ({
    name: c.name,
    slug: c.slug,
    image: c.coverImage ?? c.products[0]?.images[0]?.url ?? null,
  }));
}

export default async function Home() {
  const [featured, collections, bridalHero, recentImages] = await Promise.all([
    getFeaturedProducts(),
    getCollectionsWithCover(),
    prisma.product.findFirst({
      where: { isActive: true, collection: { slug: "bridal" } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.productImage.findMany({
      orderBy: { id: "desc" },
      take: 6,
      select: { url: true, alt: true },
    }),
  ]);

  const heroImage = featured[0]?.coverImage ?? featured[1]?.coverImage ?? null;
  const heroImageAlt = featured[0]?.coverImageAlt ?? "Featured piece";
  const secondaryHeroImage = featured[1]?.coverImage ?? featured[0]?.coverImage ?? null;

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;

  return (
    <div>
      {/* Hero */}
      <section className="overflow-hidden bg-rose-soft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">
              Minimalist · Western · Bridal
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
              Jewelry for the <span className="text-rose italic">everyday</span> you.
            </h1>
            <p className="mt-4 max-w-md text-sm text-foreground/70">
              Minimalist daily wear, western pieces and bridal sets. Chosen with care and
              delivered to your door.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/collections/daily-wear"
                className="rounded-full bg-green px-6 py-3 text-sm text-white hover:bg-green-dark"
              >
                Shop new arrivals
              </Link>
              <WhatsAppButton
                message="Hi! I'd like to know more about your jewelry."
                variant="outline"
              />
            </div>
            <p className="mt-4 text-xs text-muted">
              Cash on delivery · Order on WhatsApp · Gift-ready packaging
            </p>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-sm">
            <div className="arch absolute inset-x-8 bottom-0 top-8 bg-green-soft" />
            {secondaryHeroImage && (
              <div className="absolute right-0 top-0 h-28 w-28 overflow-hidden rounded-full sm:h-36 sm:w-36">
                <Image src={secondaryHeroImage} alt="" fill className="object-cover" />
              </div>
            )}
            {heroImage ? (
              <div className="arch absolute inset-x-0 bottom-0 top-16 overflow-hidden">
                <Image src={heroImage} alt={heroImageAlt} fill className="object-cover" priority />
              </div>
            ) : (
              <div className="arch absolute inset-x-0 bottom-0 top-16 flex items-center justify-center bg-rose-soft">
                <DiamondIcon className="h-10 w-10 text-rose" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Shop by category */}
      {collections.length > 0 && (
        <section className="bg-rose-soft/40 py-16">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Browse</p>
            <h2 className="mt-2 font-display text-3xl text-foreground">Shop by category</h2>
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {collections.map((c, i) => (
                <Link key={c.slug} href={`/collections/${c.slug}`} className="group text-left">
                  <div
                    className={`arch relative aspect-square overflow-hidden ${
                      i % 2 === 0 ? "bg-rose-soft" : "bg-green-soft"
                    }`}
                  >
                    {c.image ? (
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <DiamondIcon
                          className={`h-8 w-8 ${i % 2 === 0 ? "text-rose" : "text-green"}`}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                    <span className="text-xs text-rose">Explore</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Just In</p>
            <h2 className="mt-2 font-display text-3xl text-foreground">New arrivals</h2>
          </div>
          <Link href="/collections/daily-wear" className="text-sm text-rose hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {featured.length === 0 && (
          <p className="mt-4 text-sm text-muted">
            No featured products yet — mark some as featured in the admin, or run the seed script.
          </p>
        )}
      </section>

      {/* Shop by occasion */}
      <section className="bg-green-soft py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-green-dark">
            Find Your Piece
          </p>
          <h2 className="mt-2 font-display text-3xl text-foreground">Shop by occasion</h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {OCCASIONS.map((o) => (
              <Link
                key={o.name}
                href={`/collections/${o.collectionSlug}`}
                className="rounded-2xl bg-surface p-6 text-left hover:shadow-sm"
              >
                <span className="block text-sm font-medium text-foreground">{o.name}</span>
                <span className="mt-2 block text-rose">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* The Bridal Edit */}
      <section className="grid lg:grid-cols-2">
        <div className="relative aspect-square bg-green lg:aspect-auto">
          {bridalHero?.images[0]?.url ? (
            <Image
              src={bridalHero.images[0].url}
              alt={bridalHero.images[0].alt}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <DiamondIcon className="h-12 w-12 text-white/70" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center bg-rose-soft px-6 py-16 sm:px-10 lg:px-16">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">
            The Bridal Edit
          </p>
          <h2 className="mt-2 font-display text-3xl text-foreground sm:text-4xl">
            For the days you will remember.
          </h2>
          <p className="mt-4 max-w-md text-sm text-foreground/70">
            Necklace sets, earrings and matching pieces, ready for nikkah, mehndi and walima.
          </p>
          <Link
            href="/collections/bridal"
            className="mt-6 inline-block w-fit rounded-full bg-green px-6 py-3 text-sm text-white hover:bg-green-dark"
          >
            Shop bridal sets
          </Link>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-rose-soft/40 py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
          <TrustItem
            icon={<CashIcon className="h-6 w-6 text-green-dark" />}
            title="Cash on delivery"
            description="Pay when your order reaches you."
          />
          <TrustItem
            icon={<ChatIcon className="h-6 w-6 text-rose" />}
            title="Order on WhatsApp"
            description="Message us to order or ask about a piece."
          />
          <TrustItem
            icon={<GiftIcon className="h-6 w-6 text-green-dark" />}
            title="Gift-ready packaging"
            description="Add a note at checkout and we will wrap it with care."
          />
        </div>
      </section>

      {/* Follow along */}
      {instagramUrl && recentImages.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Follow Along</p>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-display text-2xl text-foreground hover:text-rose"
          >
            @joyeriastudio on Instagram
          </a>
          <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {recentImages.map((img, i) => (
              <a
                key={i}
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative aspect-square overflow-hidden rounded-md"
              >
                <Image src={img.url} alt={img.alt} fill className="object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TrustItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
    </div>
  );
}

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 3h12l4 6-10 12L2 9l4-6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M2 9h20M8 3l4 6 4-6M12 21 9 9M12 21l3-12" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function CashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.4A7.96 7.96 0 0 1 4 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="8" width="18" height="13" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18M12 8v13" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12 8c-2-4-8-3-6 0 1 2 4 1.5 6 0Zm0 0c2-4 8-3 6 0-1 2-4 1.5-6 0Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
