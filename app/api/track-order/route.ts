import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pakistaniPhoneSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await checkRateLimit(`track:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const parsed = pakistaniPhoneSchema.safeParse(phone);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid phone number, e.g. 03001234567" }, { status: 400 });
  }

  // A phone number isn't a secret, and this endpoint is intentionally
  // account-free — but that means anyone who knows or guesses a customer's
  // number can look them up. Select only what the tracking page actually
  // renders (status, items, courier info) rather than the full row, so a
  // successful guess doesn't also hand over the delivery address or name.
  const orders = await prisma.order.findMany({
    where: { phone: parsed.data },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      city: true,
      courierName: true,
      trackingNumber: true,
      createdAt: true,
      items: {
        select: { id: true, productName: true, quantity: true, price: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ orders });
}
