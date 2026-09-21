# Joyería Studio

Storefront for a Pakistani artificial jewelry business. Guest checkout with cash on
delivery, WhatsApp ordering, and stock-safe order placement — no customer accounts
required.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma · PostgreSQL · Zustand

## What's built (Phase 1–3 of the build order)

- **Catalog** — home page, collection pages with material filters and price sort,
  product pages with gallery, related products, and `Product` JSON-LD for SEO.
- **Cart & guest checkout** — Zustand cart persisted to `localStorage`, checkout form
  (name, phone, address, city, payment method), plus an "Order on WhatsApp" button
  everywhere a customer might want one.
- **Stock-safe orders** — `/api/checkout` re-prices the cart server-side inside a
  single Prisma transaction that also decrements stock, so two buyers can never both
  win the last piece. Delivery fee is looked up per city (`DeliveryRate`), coupons
  are supported, and a honeypot field + basic rate limiting sit in front of it.
- **Order tracking** — `/track-order` looks orders up by phone number.
- **SEO basics** — per-page metadata, `sitemap.ts`, JSON-LD on product pages.

Not built yet, per the original plan: the admin dashboard (order status changes,
product CRUD, Cloudinary image uploads), NextAuth-protected `/admin`, bank
transfer/JazzCash/Easypaisa screenshot upload, and the Meta Pixel / Instagram feed
polish. The schema already has the tables these need (`AdminUser`, `paymentProofUrl`
on `Order`), so those are additive.

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

## Next steps (build order, continued)

1. Admin dashboard: orders list with status transitions + courier tracking field,
   product create/edit from a phone, guarded by NextAuth + `AdminUser`.
2. Cloudinary signed uploads for product photos, straight from the browser.
3. Bank transfer / JazzCash / Easypaisa with screenshot upload (`Order.paymentProofUrl`
   already exists for this).
4. Coupon UI in the checkout form (the backend already validates `couponCode`).
5. Deploy: Vercel + Neon + Cloudinary + Resend, `prisma migrate deploy` on release.
