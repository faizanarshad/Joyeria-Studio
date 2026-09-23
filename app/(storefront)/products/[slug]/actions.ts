"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

export type ReviewFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

export async function submitReview(
  _prevState: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await checkRateLimit(`review:${ip}`, 5, 60_000)) {
    return { error: "Too many reviews submitted. Please wait a minute and try again." };
  }

  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    customerName: formData.get("customerName"),
    rating: formData.get("rating"),
    comment: formData.get("comment"),
    hp_confirm: formData.get("hp_confirm"),
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Honeypot tripped — same generic response as every other failure, so a
  // bot gets no signal that this field is what gave it away.
  if (parsed.data.hp_confirm) {
    return { error: "Something went wrong. Please try again." };
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) {
    return { error: "This product is no longer available." };
  }

  await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      customerName: parsed.data.customerName,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  // Not yet visible to other shoppers — isApproved defaults to false until
  // an admin moderates it — but revalidate anyway so the admin queue and
  // this page pick it up as soon as it's approved rather than waiting out
  // the page's normal revalidate window.
  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/admin/reviews");

  return { success: true };
}
