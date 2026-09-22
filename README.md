# Joyería Studio

Storefront for a Pakistani artificial jewelry business. Guest checkout with cash on
delivery, WhatsApp ordering, and stock-safe order placement — no customer accounts
required.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma · PostgreSQL · Zustand

## What's built

- **Catalog** — home page, collection pages with material filters and price sort,
  product pages with gallery, related products, and `Product` JSON-LD for SEO.
- **Cart & guest checkout** — Zustand cart persisted to `localStorage`, checkout form
  (name, phone, address, city, payment method), free delivery above a configurable
  threshold, plus an "Order on WhatsApp" button everywhere a customer might want one.
- **Stock-safe orders** — `/api/checkout` re-prices the cart server-side inside a
  single Prisma transaction that also decrements stock, so two buyers can never both
  win the last piece. Delivery fee is looked up per city (`DeliveryRate`), coupons
  are supported, and a honeypot field + basic rate limiting sit in front of it.
- **Order tracking** — `/track-order` looks orders up by phone number.
- **Admin dashboard** (`/admin`, NextAuth-protected) — orders list with status/courier
  updates, product create/edit/delete, all guarded by `AdminUser` credentials.
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
