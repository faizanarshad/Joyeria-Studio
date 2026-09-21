"use client";

import { useActionState } from "react";
import { authenticate } from "@/app/admin/login/actions";

export default function LoginForm() {
  const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">Password</label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-md border border-border px-3 py-2 text-sm"
        />
      </div>
      {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-foreground px-6 py-3 text-sm text-white hover:bg-rose-dark disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
