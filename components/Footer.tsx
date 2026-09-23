import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export default async function Footer() {
  const collections = await prisma.collection
    .findMany({ orderBy: { sortOrder: "asc" }, take: 6, select: { name: true, slug: true } })
    .catch(() => []);

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL;

  return (
    <footer className="bg-green text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 font-display text-lg">
              <Image src="/logo/icon.png" alt="" width={40} height={24} className="h-6 w-auto" />
              Joyería <span className="text-xs tracking-[0.3em] text-white/60">STUDIO</span>
            </p>
            <p className="mt-3 max-w-xs text-sm text-white/70">
              Everyday jewelry, thoughtfully chosen. Minimalist, western and bridal pieces.
            </p>
            <Link href="/our-story" className="mt-3 inline-block text-sm text-white/80 underline hover:text-white">
              Our Story
            </Link>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/60">Shop</p>
            <ul className="space-y-2 text-sm text-white/80">
              {collections.map((c) => (
                <li key={c.slug}>
                  <Link href={`/collections/${c.slug}`} className="hover:text-white">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/60">Help</p>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <a href={buildWhatsAppLink("Hi! I have a question about delivery.")} className="hover:text-white">
                  Delivery
                </a>
              </li>
              <li>
                <a href={buildWhatsAppLink("Hi! I have a question about returns.")} className="hover:text-white">
                  Returns
                </a>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-white">
                  Track your order
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-white/60">Follow</p>
            <ul className="space-y-2 text-sm text-white/80">
              {instagramUrl && (
                <li>
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    Instagram
                  </a>
                </li>
              )}
              {facebookUrl && (
                <li>
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    Facebook
                  </a>
                </li>
              )}
              <li>
                <a href={buildWhatsAppLink("Hi!")} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-xs text-white/60">
          © {new Date().getFullYear()} Joyería Studio. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
