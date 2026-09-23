# Joyería Studio

Storefront for a Pakistani artificial jewelry business. Guest checkout with cash on
delivery, WhatsApp ordering, and stock-safe order placement — no customer accounts
required.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma · PostgreSQL · Zustand ·
Motion (Framer Motion)

## What's built

- **Catalog** — home page, collection pages with material filters, a dual-handle
  price range slider (bounded to that collection's actual min/max, composes with
  material filter and sort rather than resetting them), product pages with gallery,
  related products, and `Product` JSON-LD for SEO.
- **Our Story** (`/our-story`) — brand narrative, values, and a bridal callout. The
  copy is placeholder-quality writing, not placeholder-quality *content* — but the
  specifics (founding year, founder, real numbers) are generic on purpose. Replace
  them with the real story before launch.
- **Cart & guest checkout** — Zustand cart persisted to `localStorage`, checkout form
  (name, phone, address, city, payment method), free delivery above a configurable
  threshold, plus an "Order on WhatsApp" button everywhere a customer might want one.
  Cash on delivery is only offered below a configurable order total
  (`ADVANCE_PAYMENT_THRESHOLD`, default Rs 5,000) — above it, the COD option is
  disabled in the form and rejected server-side on the re-priced total (`lib/payment.ts`),
  and the customer prepays via bank transfer, JazzCash or Easypaisa instead. There's no
  payment gateway, so this is full prepayment, not a partial deposit with COD for the
  rest — the simplest version of "advance payment required" this app can actually
  enforce without building real payment processing.
- **Product reviews** — a star rating + comment form on every product page
  (`components/ReviewForm.tsx`), guarded by the same honeypot pattern as checkout.
  Reviews are held back from the storefront (`Review.isApproved`, default `false`)
  until approved in `/admin/reviews` — unmoderated public free text is a spam vector
  like any other, and the admin dashboard surfaces a pending-review count the same
  way it does pending orders. Approved reviews feed a product's average rating,
  shown next to its title and folded into its `Product` JSON-LD as `aggregateRating`.
- **Return policy, jewelry care & payment terms** — a collapsible info section on
  every product page (`components/ProductPolicies.tsx`) covering exchanges (defects
  only, within 3 days, unworn), general jewelry care plus a product's own `careNote`
  when set, and the COD/advance-payment split above. Copy lives in `lib/policies.ts` —
  real writing, but placeholder specifics (day counts etc.) like the Our Story page;
  replace with your actual policy before launch.
- **Stock-safe orders** — `/api/checkout` re-prices the cart server-side inside a
  single Prisma transaction that also decrements stock, so two buyers can never both
  win the last piece. Coupon usage limits are enforced the same way (`updateMany`
  with the limit folded into the WHERE clause, not a read-then-write). Order
  numbers retry up to 3 times on the rare collision (`orderNumber` is `@unique`)
  rather than failing the whole checkout. Delivery fee is looked up per city
  (`DeliveryRate`), and a honeypot field + rate limiting (`lib/rate-limit.ts` —
  in-memory by default, switches to a shared Upstash Redis count when
  `UPSTASH_REDIS_REST_URL`/`_TOKEN` are set, since in-memory undercounts across
  Vercel's separate serverless instances) sit in front of it.
- **Order tracking** — `/track-order` looks orders up by phone number and returns
  only what the tracking page renders (status, items, city, courier info) — not
  the full row. Phone numbers aren't secret, so a lookup keyed only on one
  shouldn't also hand over the address, name or delivery phone on a lucky guess.
- **Admin panel** (`/admin`, NextAuth-protected) — orders (status/courier updates),
  products (create/edit/delete), collections (create/edit/delete), delivery rates
  per city (inline add/edit/delete), coupons (create/toggle/delete), review
  moderation (approve/delete), and an analytics dashboard (revenue trend, orders
  by status, top products by units sold — see `lib/analytics.ts`). All guarded by
  `AdminUser` credentials.
- **Customer support chatbot** — a floating widget (storefront only, hidden on
  `/admin`) backed by `/api/chat` and the Claude API. It's grounded in the live
  catalog/collections/delivery data pulled fresh from Postgres on every request
  (see `lib/chat-context.ts`) — small enough to include in full rather than needing
  vector search. Falls back to a "message us on WhatsApp" prompt if
  `ANTHROPIC_API_KEY` isn't set, or the catalog grows past what a single context
  window can hold (at which point swap `buildStoreContext()` for a real embedding
  search — nothing else depends on how that function is implemented).
- **SEO basics** — per-page metadata, `sitemap.ts`, `robots.ts`, JSON-LD on product
  pages.
- **Motion** — fade-up hero on load, scroll parallax + a one-time light-sweep on the
  hero photo, scroll-triggered section reveals (`components/motion/Reveal.tsx`), a
  scroll progress bar, product card hover (lift + shadow + crossfade to a second
  photo when one exists + a subtle sparkle on featured pieces), an "Add to bag"
  checkmark morph, a cart-badge bounce, a mobile nav drawer (there was no mobile nav
  before this — links were `hidden md:flex` with no fallback), an animated
  hover-underline on desktop nav, a shimmer skeleton for collection pages
  (`loading.tsx`), a click-to-zoom lightbox on product photos, and ambient floating
  rose/leaf petals genuinely rotated in 3D (`components/motion/FloatingPetals.tsx`
  — real `rotateX`/`rotateY`/`translateZ` inside a `perspective` container, not a
  flat fake) on the emotionally-led sections only: both hero sections and the
  bridal callouts. Deliberately left off checkout, cart and admin, where decoration
  would compete with someone trying to finish a task. (A larger illustrated flower
  centerpiece was tried and removed twice — a filled bloom read as clip-art, a
  line-art cluster still wasn't wanted; the small ambient petals are the version
  that stuck.) Kept restrained everywhere — motion
  durations stay under ~600ms, and the hero parallax respects
  `prefers-reduced-motion`.
- **Real rose photography** — the Our Story intro hero has one free-license photo
  from [Unsplash](https://unsplash.com/s/photos/rose) (`components/motion/PhotoAccent.tsx`),
  circular-framed, fully inset within the section (not bled off the edge — an
  earlier version clipped part of the circle against the section boundary, which
  looked broken rather than composed), hotlinked from Unsplash's CDN per their
  License (no attribution required). Only one placement: a second copy in the
  bridal callout was redundant next to the real bridal product photo already
  there and got removed. Deliberately static, not the 3D rotation used
  on the icon illustrations — spinning an actual photograph in 3D reads as a
  gimmick, not a product shot.

Not built yet: Cloudinary signed uploads (product images currently take a plain
URL), bank transfer/JazzCash/Easypaisa screenshot upload (the `Order.paymentProofUrl`
column exists for this), and coupon UI in the checkout form (the backend already
validates `couponCode`).

## Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL at minimum
npm run db:push        # create tables from prisma/schema.prisma
npm run db:seed        # load sample products, collections, delivery rates, a coupon
npm run dev
```

Open http://localhost:3000.

### Local database

For local development you can run Postgres via Homebrew (`brew install
postgresql@16`) or Docker. Point `DATABASE_URL` at it. For production, use a free
[Neon](https://neon.tech) Postgres database — just swap the connection string.

### Environment variables

See `.env.example`. The two that matter immediately:

- `DATABASE_URL` — your Postgres connection string.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — the number "Order on WhatsApp" and order
  confirmation messages point at (digits only, with country code, e.g.
  `923001234567`).

`ORDER_NOTIFY_WEBHOOK_URL` is optional — point it at a Slack/Discord incoming
webhook and every new order posts a one-line summary there.

`ANTHROPIC_API_KEY` is optional — without it the chat widget shows a WhatsApp
fallback instead of erroring. Get one at https://console.anthropic.com.

`NEXT_PUBLIC_INSTAGRAM_URL` / `NEXT_PUBLIC_FACEBOOK_URL` are optional — set them
to show real links in the footer and the homepage's "Follow Along" section
(hidden entirely when unset, rather than linking nowhere).

## Data model notes

- Prices are whole PKR integers — no float rounding anywhere.
- `OrderItem` snapshots `productName` and `price` at purchase time, and
  `productId` is nullable, so deleting or repricing a product never rewrites past
  orders.
- `Product.costPrice` is never selected on any storefront query — it's for a future
  admin margin view only.
- Every order starts `PENDING`. The plan is to confirm real orders over WhatsApp
  (there's a "Confirm on WhatsApp" button on the success page) before moving them to
  `CONFIRMED` and shipping — this is what keeps fake COD orders from clogging the
  pipeline.

## Next steps

1. Cloudinary signed uploads for product photos, straight from the browser.
2. Bank transfer / JazzCash / Easypaisa with screenshot upload (`Order.paymentProofUrl`
   already exists for this).
3. Coupon UI in the checkout form (the backend already validates `couponCode`).
4. Real product photography — swap the plain-background placeholder SVGs in
   `public/products/` for actual shots via the admin.
5. Deploy: Vercel + Neon + Cloudinary + Resend, `prisma migrate deploy` on release.
