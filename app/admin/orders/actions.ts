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

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true, items: { select: { productId: true, quantity: true } } },
    });

    // Checkout decrements stock atomically when an order is placed; nothing
    // ever put it back. Cancelling an order is the routine way fake/refused
    // COD orders get filtered out of the pipeline (see README), so without
    // this every cancellation would permanently leak that stock out of the
    // catalog. Symmetrically, un-cancelling re-reserves it — gated the same
    // way checkout gates a fresh order, so it can't oversell.
    const wasCancelled = order.status === "CANCELLED";
    const willBeCancelled = status === "CANCELLED";

    if (!wasCancelled && willBeCancelled) {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    } else if (wasCancelled && !willBeCancelled) {
      for (const item of order.items) {
        if (!item.productId) continue;
        const { count } = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (count === 0) {
          throw new Error(
            "Not enough stock left to un-cancel this order — restock the product first."
          );
        }
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: status as OrderStatus,
        courierName: courierName || null,
        trackingNumber: trackingNumber || null,
      },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
