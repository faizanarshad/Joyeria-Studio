"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import WhatsAppButton from "@/components/WhatsAppButton";
import AnimatedDiamondIcon from "@/components/motion/AnimatedDiamondIcon";
import FloatingPetals from "@/components/motion/FloatingPetals";

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

// Free-license Unsplash photo (unsplash.com/s/photos/yellow-rose), hotlinked
// from their CDN per the Unsplash License.
const ROSE_BACKGROUND =
  // unsplash.com/photos/a-bunch-of-yellow-roses-with-green-leaves-CfzNNc7NsnQ — Aleyna Çatak
  "https://images.unsplash.com/photo-1712258091854-ac9460506a76?w=1600&q=80&auto=format&fit=crop";

export default function HeroSection({
  heroImage,
  heroImageAlt,
  secondaryHeroImage,
}: {
  heroImage: string | null;
  heroImageAlt: string;
  secondaryHeroImage: string | null;
}) {
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imageWrapRef,
    offset: ["start start", "end start"],
  });
  const reducedMotion = useReducedMotion();
  // Background arch moves slower than the foreground photo as the page scrolls.
  const bgY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, 40]);
  const fgY = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [0, 16]);

  return (
    <section className="relative overflow-hidden bg-rose-soft">
      <Image src={ROSE_BACKGROUND} alt="" fill priority sizes="100vw" className="object-cover" />
      {/* Dark scrim so the light-on-pastel text this section was built for
          still reads against a busy, dark photo instead of a flat color. */}
      {/* Yellow petals are much brighter than the red roses this overlay was
          tuned for — bright enough that even /65 left a washed-out patch
          behind the trust line. Gone darker rather than tune to one crop. */}
      <div className="absolute inset-0 bg-black/75" />
      <FloatingPetals count={10} seed={3} />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } }}
        >
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium uppercase tracking-[0.2em] text-rose-soft"
          >
            Minimalist · Western · Bridal
          </motion.p>
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.55 }}
            className="mt-3 font-display text-4xl leading-tight text-white sm:text-5xl"
          >
            Jewelry for the <span className="text-rose-soft italic">everyday</span> you.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mt-4 max-w-md text-sm text-white/90"
          >
            Minimalist daily wear, western pieces and bridal sets. Chosen with care and
            delivered to your door.
          </motion.p>
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/collections/daily-wear"
              className="rounded-full bg-green px-6 py-3 text-sm text-white hover:bg-green-dark"
            >
              Shop new arrivals
            </Link>
            <WhatsAppButton message="Hi! I'd like to know more about your jewelry." variant="outlineLight" />
          </motion.div>
          <motion.p variants={fadeUp} transition={{ duration: 0.5 }} className="mt-4 text-xs text-white/85">
            Cash on delivery · Order on WhatsApp · Gift-ready packaging
          </motion.p>
        </motion.div>

        <motion.div
          ref={imageWrapRef}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto aspect-square w-full max-w-sm"
        >
          <motion.div style={{ y: bgY }} className="arch absolute inset-x-8 bottom-0 top-8 bg-green-soft" />
          {secondaryHeroImage && (
            <motion.div
              style={{ y: fgY }}
              className="absolute right-0 top-0 h-28 w-28 overflow-hidden rounded-full sm:h-36 sm:w-36"
            >
              <Image
                src={secondaryHeroImage}
                alt=""
                fill
                sizes="(min-width: 640px) 144px, 112px"
                className="object-cover"
              />
            </motion.div>
          )}
          {heroImage ? (
            <motion.div style={{ y: fgY }} className="arch absolute inset-x-0 bottom-0 top-16 overflow-hidden">
              <Image
                src={heroImage}
                alt={heroImageAlt}
                fill
                sizes="(min-width: 640px) 384px, 100vw"
                className="object-cover"
                priority
              />
              {/* A one-time light sweep across the piece, like a glint catching the metal. */}
              <motion.div
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 1.4, delay: 0.9, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
            </motion.div>
          ) : (
            <div className="arch absolute inset-x-0 bottom-0 top-16 flex items-center justify-center bg-rose-soft">
              <AnimatedDiamondIcon className="h-10 w-10 text-rose" />
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
