import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import Reveal from "@/components/motion/Reveal";
import FloatingPetals from "@/components/motion/FloatingPetals";
import ElegantFlorals3D from "@/components/motion/ElegantFlorals3D";

export const revalidate = 300;

export const metadata = {
  title: "Our Story",
  description:
    "Why Joyería Studio exists, how every piece is chosen, and what we promise you when you order.",
};

const VALUES = [
  {
    title: "Thoughtfully Chosen",
    body: "Every piece earns its place in the catalog. We'd rather list twelve pieces we'd wear ourselves than a hundred we wouldn't.",
  },
  {
    title: "Made for Real Days",
    body: "Daily wear that survives a full day at work, western pieces for going out, and bridal sets built for the ceremonies that matter.",
  },
  {
    title: "Honest From Checkout to Doorstep",
    body: "The price you see is the price you pay. Cash on delivery, real stock counts, and a real person confirming your order before it ships.",
  },
];

export default async function OurStoryPage() {
  const [storyProduct, bridalProduct] = await Promise.all([
    prisma.product.findFirst({
      where: { isActive: true, isFeatured: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findFirst({
      where: { isActive: true, collection: { slug: "bridal" } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      {/* Intro */}
      <section className="relative overflow-hidden bg-rose-soft">
        <FloatingPetals count={12} seed={11} />
        <div className="pointer-events-none absolute -bottom-10 -right-6 hidden lg:block xl:right-6">
          <ElegantFlorals3D size={260} />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Our Story</p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-foreground sm:text-5xl">
            Jewelry you&apos;ll actually reach for.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-foreground/70">
            Joyería Studio started with a simple frustration: most affordable jewelry looks
            cheap, and most jewelry that doesn&apos;t is priced for a special occasion, not a
            Tuesday. We set out to close that gap — pieces considered enough for a photo,
            comfortable enough to forget you&apos;re wearing.
          </p>
        </div>
      </section>

      {/* Narrative */}
      <Reveal as="section" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl text-foreground">How it started</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/70">
              <p>
                Like most good things, it started small — a handful of pieces, sourced and
                tried on before they were ever listed, sold to friends before they were sold
                to strangers. What people kept coming back for wasn&apos;t novelty. It was
                pieces that held up: plating that didn&apos;t fade after two wears, clasps that
                didn&apos;t give out, designs that still looked right a year later.
              </p>
              <p>
                That&apos;s still the bar every piece has to clear before it goes on the site. We
                keep the catalog small on purpose — daily wear, western statement pieces, and
                bridal sets for the occasions that matter — because a smaller, better-chosen
                selection beats an endless scroll of things you&apos;ll never actually order.
              </p>
              <p>
                And because we know online jewelry shopping in Pakistan usually means either
                a random Instagram DM or a checkout that demands your card details upfront,
                everything here ships cash on delivery, with a real person confirming your
                order on WhatsApp before it leaves — not an algorithm, not a bot.
              </p>
            </div>
          </div>
          <div className="relative mx-auto aspect-4/5 w-full max-w-sm overflow-hidden rounded-lg bg-rose-soft">
            {storyProduct?.images[0]?.url && (
              <Image
                src={storyProduct.images[0].url}
                alt={storyProduct.images[0].alt}
                fill
                className="object-cover"
              />
            )}
          </div>
        </div>
      </Reveal>

      {/* Values */}
      <Reveal as="section" className="bg-green-soft py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-green-dark">
              What We Believe
            </p>
            <h2 className="mt-2 font-display text-3xl text-foreground">
              Three things we don&apos;t compromise on
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl bg-surface p-6">
                <p className="font-display text-lg text-foreground">{v.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Pull quote */}
      <Reveal as="section" className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <p className="font-display text-2xl leading-relaxed text-foreground sm:text-3xl">
          &ldquo;We&apos;re not trying to be everything to everyone. We&apos;re trying to be
          the jewelry drawer you actually open.&rdquo;
        </p>
      </Reveal>

      {/* Bridal callout */}
      <Reveal as="section" className="grid lg:grid-cols-2">
        <div className="relative flex flex-col justify-center overflow-hidden bg-rose-soft px-6 py-16 sm:px-10 lg:px-16">
          <FloatingPetals count={8} seed={23} />
          <p className="relative text-xs font-medium uppercase tracking-[0.2em] text-rose">For the big days</p>
          <h2 className="relative mt-2 font-display text-3xl text-foreground sm:text-4xl">
            Bridal is where we slow down.
          </h2>
          <p className="relative mt-4 max-w-md text-sm text-foreground/70">
            Kundan, polki and stone sets don&apos;t get the same fast-turnaround treatment as
            daily wear. They&apos;re chosen for how they photograph under event lighting, not
            just on a plain background — because that&apos;s the one day you don&apos;t get a re-do.
          </p>
          <Link
            href="/collections/bridal"
            className="relative mt-6 inline-block w-fit rounded-full bg-green px-6 py-3 text-sm text-white hover:bg-green-dark"
          >
            Shop the Bridal Edit
          </Link>
        </div>
        <div className="relative aspect-square bg-green lg:aspect-auto">
          {bridalProduct?.images[0]?.url && (
            <Image
              src={bridalProduct.images[0].url}
              alt={bridalProduct.images[0].alt}
              fill
              className="object-cover"
            />
          )}
        </div>
      </Reveal>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-2xl text-foreground">Have a question before you order?</h2>
        <p className="mt-2 text-sm text-foreground/70">
          We&apos;re on WhatsApp for anything the product page doesn&apos;t answer.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full border border-rose px-6 py-3 text-sm text-rose hover:bg-rose hover:text-white"
        >
          Get in Touch
        </Link>
      </section>
    </div>
  );
}
