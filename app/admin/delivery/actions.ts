"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deliveryRateSchema } from "@/lib/validation";

export async function saveDeliveryRate(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "");
  const parsed = deliveryRateSchema.safeParse({
    city: formData.get("city"),
    fee: formData.get("fee"),
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid delivery rate");

  if (id) {
    await prisma.deliveryRate.update({ where: { id }, data: parsed.data });
  } else {
    await prisma.deliveryRate.upsert({
      where: { city: parsed.data.city },
      update: parsed.data,
      create: parsed.data,
    });
  }

  revalidatePath("/admin/delivery");
  revalidatePath("/", "layout");
}

export async function deleteDeliveryRate(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "");
  await prisma.deliveryRate.delete({ where: { id } });

  revalidatePath("/admin/delivery");
  revalidatePath("/", "layout");
}
