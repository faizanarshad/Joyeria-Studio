"use client";

import { createContext, useContext, useState } from "react";
import Gallery from "@/components/Gallery";
import WhatsAppButton from "@/components/WhatsAppButton";
import { productWhatsAppMessage } from "@/lib/whatsapp";
import { swatchFor } from "@/lib/variant-colors";

export type VariantOption = {
  id: string;
  color: string;
  imageUrl: string | null;
  stock: number;
};

type VariantState = {
  variants: VariantOption[];
  selected: VariantOption | null;
  select: (id: string) => void;
};

const VariantContext = createContext<VariantState | null>(null);

// Shares the chosen colour between the gallery, the swatches and the cart
// buttons on a product page. Outside a provider (products without colour
// options) useSelectedVariant() returns null and everything behaves as before.
export function VariantProvider({
  variants,
  children,
}: {
  variants: VariantOption[];
  children: React.ReactNode;
}) {
  const [selectedId, setSelectedId] = useState(
    () => (variants.find((v) => v.stock > 0) ?? variants[0])?.id ?? null
  );
  const selected = variants.find((v) => v.id === selectedId) ?? null;
  return (
    <VariantContext.Provider value={{ variants, selected, select: setSelectedId }}>
      {children}
    </VariantContext.Provider>
  );
}

export function useSelectedVariant(): VariantState | null {
  return useContext(VariantContext);
}

// The product gallery, led by the chosen colour's photo when it has one.
export function VariantGallery({ images }: { images: { url: string; alt: string }[] }) {
  const state = useSelectedVariant();
  const selected = state?.selected;
  const shown = selected?.imageUrl
    ? [
        { url: selected.imageUrl, alt: `${images[0]?.alt ?? "Product"} — ${selected.color}` },
        ...images.filter((img) => img.url !== selected.imageUrl),
      ]
    : images;
  // Keyed on the colour so the gallery resets to the first photo on every switch.
  return <Gallery key={selected?.id ?? "default"} images={shown} />;
}

export function ColorSwatches() {
  const state = useSelectedVariant();
  if (!state || state.variants.length === 0) return null;
  const { variants, selected, select } = state;

  return (
    <div className="mt-5">
      <p className="text-sm text-foreground">
        Colour: <span className="font-medium">{selected?.color}</span>
        {selected && selected.stock === 0 && <span className="ml-2 text-muted">(sold out)</span>}
      </p>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
        {variants.map((v) => {
          const isSelected = v.id === selected?.id;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${v.color}${v.stock === 0 ? " (sold out)" : ""}`}
              title={v.color}
              onClick={() => select(v.id)}
              className={`relative h-9 w-9 rounded-full border-2 transition ${
                isSelected ? "border-foreground" : "border-border hover:border-foreground/40"
              } ${v.stock === 0 ? "opacity-40" : ""}`}
            >
              <span
                className="absolute inset-1 rounded-full"
                style={{ background: swatchFor(v.color) }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// WhatsApp enquiry that names the chosen colour.
export function VariantWhatsAppButton({ name, price }: { name: string; price: number }) {
  const color = useSelectedVariant()?.selected?.color;
  return (
    <WhatsAppButton
      message={productWhatsAppMessage(color ? `${name} (${color})` : name, price)}
      className="w-full"
    />
  );
}
