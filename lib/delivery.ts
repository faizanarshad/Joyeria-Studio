import { prisma } from "@/lib/prisma";

const DEFAULT_DELIVERY_FEE = 250;

export const FREE_DELIVERY_THRESHOLD = Number(process.env.FREE_DELIVERY_THRESHOLD ?? 3000);

export async function getDeliveryFee(city: string): Promise<number> {
  const rate = await prisma.deliveryRate.findFirst({
    where: { city: { equals: city.trim(), mode: "insensitive" }, isActive: true },
  });
  return rate?.fee ?? DEFAULT_DELIVERY_FEE;
}

export async function listCities(): Promise<{ city: string; fee: number }[]> {
  const rates = await prisma.deliveryRate.findMany({
    where: { isActive: true },
    orderBy: { city: "asc" },
  });
  if (rates.length > 0) return rates.map((r) => ({ city: r.city, fee: r.fee }));
  return [{ city: "Other", fee: DEFAULT_DELIVERY_FEE }];
}

/** Delivery fee actually charged once the free-delivery threshold is applied. */
export function applyFreeDeliveryThreshold(baseFee: number, subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : baseFee;
}
