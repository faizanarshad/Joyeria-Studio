"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

export async function updateOrderStatus(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const orderId = String(formData.get("orderId"));
  const status = String(formData.get("status"));
  const courierName = String(formData.get("courierName") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    throw new Error("Invalid status");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: status as OrderStatus,
      courierName: courierName || null,
      trackingNumber: trackingNumber || null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
