import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import ChangePasswordForm from "@/components/admin/ChangePasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl text-foreground">Account</h1>
      {session?.user?.email && (
        <p className="mt-1 text-sm text-muted">
          Signed in as <span className="text-foreground">{session.user.email}</span>
        </p>
      )}

      <section className="mt-8 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-lg font-medium text-foreground">Change password</h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
