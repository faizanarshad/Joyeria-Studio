import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with Joyería Studio over WhatsApp, Instagram or Facebook.",
};

export default function ContactPage() {
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL;
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-rose">Get in Touch</p>
      <h1 className="mt-2 font-display text-4xl text-foreground">Contact Us</h1>
      <p className="mt-3 max-w-lg text-sm text-foreground/70">
        Questions about a piece, an order, sizing or delivery? We reply fastest on WhatsApp — that&apos;s
        also how we confirm every order before it ships.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366]/10">
            <ChatIcon className="h-5 w-5 text-[#25D366]" />
          </div>
          <p className="mt-4 font-medium text-foreground">WhatsApp</p>
          <p className="mt-1 text-sm text-muted">
            The fastest way to reach us — order questions, sizing, custom requests, complaints.
          </p>
          <WhatsAppButton message="Hi! I'd like to get in touch." className="mt-4 w-full">
            Chat on WhatsApp
          </WhatsAppButton>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-soft">
            <TagIcon className="h-5 w-5 text-rose" />
          </div>
          <p className="mt-4 font-medium text-foreground">Track an Order</p>
          <p className="mt-1 text-sm text-muted">
            Already ordered? Look up its status anytime with the phone number you checked out with.
          </p>
          <Link
            href="/track-order"
            className="mt-4 block rounded-full border border-rose px-6 py-3 text-center text-sm text-rose hover:bg-rose hover:text-white"
          >
            Track Order
          </Link>
        </div>

        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-border bg-surface p-6 hover:border-rose"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-soft">
              <InstagramIcon className="h-5 w-5 text-rose" />
            </div>
            <p className="mt-4 font-medium text-foreground">Instagram</p>
            <p className="mt-1 text-sm text-muted">New arrivals, restocks and behind-the-scenes.</p>
          </a>
        )}

        {facebookUrl && (
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-border bg-surface p-6 hover:border-green"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-soft">
              <FacebookIcon className="h-5 w-5 text-green-dark" />
            </div>
            <p className="mt-4 font-medium text-foreground">Facebook</p>
            <p className="mt-1 text-sm text-muted">Follow our page for offers and updates.</p>
          </a>
        )}
      </div>

      <div className="mt-10 rounded-2xl bg-rose-soft/40 p-6 text-sm text-foreground/80">
        <p className="font-medium text-foreground">Delivery & Returns</p>
        <p className="mt-1">
          Cash on delivery is available across Pakistan; delivery fees vary by city and orders above
          the free-delivery threshold ship free. For a specific return or exchange, message us on{" "}
          <a
            href={buildWhatsAppLink("Hi! I'd like to ask about a return or exchange.")}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-rose underline"
          >
            WhatsApp
          </a>{" "}
          with your order number.
        </p>
      </div>
    </div>
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

function TagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M11 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.59 1.41l-8 8a2 2 0 0 1-2.82 0l-6-6a2 2 0 0 1 0-2.82l8-8A2 2 0 0 1 11 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="9" r="1.3" fill="currentColor" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14 9h2.5V6H14c-1.66 0-3 1.34-3 3v2H9v3h2v6h3v-6h2.2l.8-3H14V9.5c0-.28.22-.5.5-.5H14Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
