import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pakistaniPhoneSchema } from "@/lib/validation";
import { isRateLimited } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`track:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute." }, { status: 429 });
  }

  const phone = req.nextUrl.searchParams.get("phone") ?? "";
  const parsed = pakistaniPhoneSchema.safeParse(phone);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid phone number, e.g. 03001234567" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { phone: parsed.data },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ orders });
}
