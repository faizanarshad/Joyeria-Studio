"use client";

import { useActionState, useState } from "react";
import { slugify } from "@/lib/slugify";
import type { CollectionFormState } from "@/app/admin/collections/actions";

type Props = {
  action: (state: CollectionFormState, formData: FormData) => Promise<CollectionFormState>;
  initial?: {
    name: string;
    slug: string;
    description: string;
    coverImage: string;
    featured: boolean;
    sortOrder: number;
  };
  submitLabel?: string;
};

export default function CollectionForm({ action, initial, submitLabel = "Save Collection" }: Props) {
  const [state, formAction, isPending] = useActionState<CollectionFormState, FormData>(action, {});
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial);

  const err = (field: string) => state.fieldErrors?.[field]?.[0];

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      <Field label="Name" error={err("name")}>
        <input
          name="name"
          required
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="input"
        />
      </Field>
      <Field label="Slug" error={err("slug")}>
        <input
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
          className="input font-mono text-sm"
        />
      </Field>
      <Field label="Description">
        <textarea name="description" rows={2} defaultValue={initial?.description} className="input" />
      </Field>
      <Field label="Cover Image URL" error={err("coverImage")}>
        <input name="coverImage" defaultValue={initial?.coverImage} placeholder="https://..." className="input" />
      </Field>
      <Field label="Sort Order" error={err("sortOrder")}>
        <input
          name="sortOrder"
          type="number"
          defaultValue={initial?.sortOrder ?? 0}
          className="input"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="featured" defaultChecked={initial?.featured ?? false} />
        Featured (shown in the main nav)
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-foreground px-6 py-3 text-sm text-white hover:bg-rose-dark disabled:opacity-60"
      >
        {isPending ? "Saving..." : submitLabel}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          background: var(--surface);
        }
      `}</style>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}
