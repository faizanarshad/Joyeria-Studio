import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { applyFreeDeliveryThreshold } from "@/lib/delivery";
import { generateOrderNumber } from "@/lib/order-number";
import { checkRateLimit } from "@/lib/rate-limit";
import { ADVANCE_PAYMENT_THRESHOLD, codAllowed } from "@/lib/payment";
import { formatPKR } from "@/lib/format";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await checkRateLimit(`checkout:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order details", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Honeypot tripped. Previously this feigned a 201 success with a made-up
  // order number — but some autofill tools do fill display:none fields with
  // common names like "website", and a real customer catching that trap saw
  // a fake success page that 404'd, with no real order ever placed. Falling
  // through to the same generic error every other failure path returns is
  // safer for that false-positive case and gives a determined bot no more
  // signal than a slightly-off cart would.
  if (parsed.data.hp_confirm) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again or message us on WhatsApp." },
      { status: 500 }
    );
  }

  const { items, customerName, phone, address, city, paymentMethod, couponCode, note } =
    parsed.data;

  // orderNumber is a 5-digit random pick (~90k possibilities) — collisions are
  // rare but not impossible, and re-running the whole request (re-checking
  // stock, re-pricing, re-touching the coupon) is safer than trying to patch
  // just the order number in place. Retry a few times with a fresh number
  // before giving up; every other failure still propagates on the first try.
  const MAX_ORDER_NUMBER_ATTEMPTS = 3;

  try {
    let result: Awaited<ReturnType<typeof placeOrder>> | undefined;
    for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt++) {
      try {
        result = await placeOrder();
        break;
      } catch (err) {
        const isOrderNumberCollision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002" &&
          (err.meta?.target as string[] | undefined)?.includes("orderNumber");
        if (!isOrderNumberCollision || attempt === MAX_ORDER_NUMBER_ATTEMPTS) throw err;
      }
    }
    if (!result) throw new Error("Unreachable: loop always throws or assigns result");

    // Fire-and-forget admin notification — a slow/failed notification must never fail the order.
    notifyNewOrder(result).catch((err) => console.error("Order notification failed", err));

    return NextResponse.json({ orderNumber: result.orderNumber }, { status: 201 });
  } catch (err) {
    if (err instanceof CheckoutError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Could not place order, please try again." },
        { status: 409 }
      );
    }
    console.error("Checkout failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  function placeOrder() {
    return prisma.$transaction(async (tx) => {
      const productIds = items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      // Server is the source of truth for prices and stock — never trust the client's cart.
      for (const item of items) {
        if (!productMap.has(item.productId)) {
          throw new CheckoutError(`One of the items in your cart is no longer available.`);
        }
      }

      // Decrement stock with the availability check baked into the WHERE clause, so the
      // check-then-write is a single atomic statement at the database level. Two concurrent
      // checkouts for the last piece can't both pass a separate read-then-update — under
      // READ COMMITTED (Postgres's default) that would be a classic lost-update race.
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) {
          throw new CheckoutError(
            `Only ${product.stock} left of "${product.name}" — please adjust the quantity.`
          );
        }
      }

      const subtotal = items.reduce((sum, item) => {
        const product = productMap.get(item.productId)!;
        return sum + product.price * item.quantity;
      }, 0);

      let discount = 0;
      let couponId: string | null = null;
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
        const eligible =
          coupon &&
          coupon.isActive &&
          (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
          (!coupon.minOrderValue || subtotal >= coupon.minOrderValue);

        if (coupon && eligible) {
          // Same lost-update race as stock: checking usedCount < usageLimit and then
          // incrementing in a separate statement lets two concurrent checkouts both
          // pass the check before either commits, pushing usedCount past the limit.
          // Fold the limit into the update's WHERE clause so it's one atomic op.
          const { count } = await tx.coupon.updateMany({
            where: {
              id: coupon.id,
              ...(coupon.usageLimit !== null ? { usedCount: { lt: coupon.usageLimit } } : {}),
            },
            data: { usedCount: { increment: 1 } },
          });

          if (count > 0) {
            discount =
              coupon.discountType === "PERCENT"
                ? Math.round((subtotal * coupon.value) / 100)
                : Math.min(coupon.value, subtotal);
            couponId = coupon.id;
          }
        }
      }

      const baseDeliveryFee = await (async () => {
        const rate = await tx.deliveryRate.findFirst({
          where: { city: { equals: city, mode: "insensitive" }, isActive: true },
        });
        return rate?.fee ?? 250;
      })();
      const deliveryFee = applyFreeDeliveryThreshold(baseDeliveryFee, subtotal);

      const total = Math.max(subtotal - discount, 0) + deliveryFee;

      // Enforced on the server total, not the client's — a customer who
      // stacks a coupon to duck under the threshold client-side would still
      // get caught here, and one who's just over it after a real discount
      // correctly wouldn't be.
      if (paymentMethod === "COD" && !codAllowed(total)) {
        throw new CheckoutError(
          `Orders of ${formatPKR(ADVANCE_PAYMENT_THRESHOLD)} or more need advance payment — cash on delivery isn't available above that. Please choose bank transfer, JazzCash or Easypaisa.`
        );
      }

      const orderNumber = generateOrderNumber();

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          phone,
          address,
          city,
          subtotal,
          deliveryFee,
          discount,
          total,
          paymentMethod,
          couponId,
          note: note || null,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: item.quantity,
                imageUrl: product.images[0]?.url ?? null,
              };
            }),
          },
        },
        include: { items: true },
      });

      return order;
    });
  }
}

class CheckoutError extends Error {}

async function notifyNewOrder(order: { orderNumber: string; total: number; customerName: string; phone: string }) {
  const webhookUrl = process.env.ORDER_NOTIFY_WEBHOOK_URL;
  if (!webhookUrl) return;
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `New order ${order.orderNumber} — Rs ${order.total.toLocaleString("en-PK")} from ${order.customerName} (${order.phone})`,
    }),
  });
}
