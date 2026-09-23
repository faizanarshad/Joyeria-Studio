"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function toggleReviewApproval(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  const isApproved = formData.get("isApproved") === "true";
  const productSlug = String(formData.get("productSlug"));
  await prisma.review.update({ where: { id }, data: { isApproved: !isApproved } });

  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${productSlug}`);
}

export async function deleteReview(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const id = String(formData.get("id"));
  const productSlug = String(formData.get("productSlug"));
  await prisma.review.delete({ where: { id } });

  revalidatePath("/admin/reviews");
  revalidatePath(`/products/${productSlug}`);
}
