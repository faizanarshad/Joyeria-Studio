"use client";

import { useActionState } from "react";
import { changePassword, type ChangePasswordState } from "@/app/admin/account/actions";

const FIELDS = [
  { name: "currentPassword", label: "Current password", autoComplete: "current-password" },
  { name: "newPassword", label: "New password", autoComplete: "new-password", hint: "At least 10 characters." },
  { name: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
] as const;

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<ChangePasswordState, FormData>(changePassword, {});

  return (
    // Keyed on the success message so a successful change remounts the form
    // and clears the three fields, while a failed attempt keeps what was typed.
    <form key={state.success ?? "form"} action={formAction} className="space-y-4">
      {FIELDS.map((f) => {
        const error = state.fieldErrors?.[f.name]?.[0];
        return (
          <div key={f.name}>
            <label htmlFor={f.name} className="mb-1 block text-sm font-medium text-foreground">
              {f.label}
            </label>
            <input
              id={f.name}
              name={f.name}
              type="password"
              required
              autoComplete={f.autoComplete}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${f.name}-error` : undefined}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
            {error ? (
              <p id={`${f.name}-error`} className="mt-1 text-xs text-red-600">
                {error}
              </p>
            ) : (
              "hint" in f && <p className="mt-1 text-xs text-muted">{f.hint}</p>
            )}
          </div>
        );
      })}

      {state.error && !state.fieldErrors && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && (
        <p role="status" className="rounded-md bg-green-soft px-3 py-2 text-sm text-foreground">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-foreground px-6 py-3 text-sm text-white hover:bg-rose-dark disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Change Password"}
      </button>
    </form>
  );
}
