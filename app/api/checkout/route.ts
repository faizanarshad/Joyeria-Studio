import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { applyFreeDeliveryThreshold } from "@/lib/delivery";
import { generateOrderNumber } from "@/lib/order-number";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`checkout:${ip}`, 5, 60_000)) {
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

  // Honeypot tripped — pretend success so bots don't learn to skip the field.
  if (parsed.data.website) {
    return NextResponse.json({ orderNumber: generateOrderNumber() }, { status: 201 });
  }

  const { items, customerName, phone, address, city, paymentMethod, couponCode, note } =
    parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
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
        if (
          coupon &&
          coupon.isActive &&
          (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
          (!coupon.minOrderValue || subtotal >= coupon.minOrderValue)
        ) {
          discount =
            coupon.discountType === "PERCENT"
              ? Math.round((subtotal * coupon.value) / 100)
              : Math.min(coupon.value, subtotal);
          couponId = coupon.id;
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
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
