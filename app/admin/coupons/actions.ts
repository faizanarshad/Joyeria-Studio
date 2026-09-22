"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { couponSchema } from "@/lib/validation";

export type CouponFormState = { error?: string; fieldErrors?: Record<string, string[]> };

export async function createCoupon(
  _prevState: CouponFormState,
  formData: FormData
): Promise<CouponFormState> {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    value: formData.get("value"),
    minOrderValue: formData.get("minOrderValue") || null,
    usageLimit: formData.get("usageLimit") || null,
    expiresAt: formData.get("expiresAt") || null,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const code = parsed.data.code.toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return { error: "Please fix the errors below.", fieldErrors: { code: ["This code already exists"] } };
  }

  await prisma.coupon.create({
    data: {
      code,
      discountType: parsed.data.discountType,
      value: parsed.data.value,
      minOrderValue: parsed.data.minOrderValue ?? null,
      usageLimit: parsed.data.usageLimit ?? null,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin/coupons");
  redirect("/admin/coupons");
}

export async function toggleCoupon(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  const isActive = formData.get("isActive") === "true";
  await prisma.coupon.update({ where: { id }, data: { isActive: !isActive } });

  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  await prisma.coupon.delete({ where: { id } });

  revalidatePath("/admin/coupons");
}
