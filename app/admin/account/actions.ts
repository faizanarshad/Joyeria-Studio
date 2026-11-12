"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validation";

export type ChangePasswordState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await auth();
  const adminId = session?.user?.id;
  if (!adminId) return { error: "Your session has expired. Please sign in again." };

  // Checking the current password is a password-guessing oracle like the
  // login form is, so it gets the same limit — a session left signed in on a
  // shared computer shouldn't let someone try passwords until one sticks.
  if (await checkRateLimit(`change-password:${adminId}`, 5, 5 * 60_000)) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: adminId } });
  if (!admin) return { error: "Your session has expired. Please sign in again." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
  if (!valid) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { currentPassword: ["Current password is incorrect"] },
    };
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    // Same cost factor the seed script uses for the first admin.
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) },
  });

  return { success: "Password changed. Use your new password next time you sign in." };
}
