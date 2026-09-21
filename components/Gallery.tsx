"use client";

import Image from "next/image";
import { useState } from "react";

export default function Gallery({
  images,
}: {
  images: { url: string; alt: string }[];
}) {
  const [active, setActive] = useState(0);
  const shown = images.length > 0 ? images : [{ url: "/placeholder-jewelry.svg", alt: "Product image" }];

  return (
    <div>
      <div className="relative aspect-4/5 overflow-hidden rounded-lg bg-rose-soft">
        <Image
          src={shown[active].url}
          alt={shown[active].alt}
          fill
          priority
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      </div>
      {shown.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {shown.map((img, i) => (
            <button
              key={img.url + i}
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-md border ${
                i === active ? "border-rose" : "border-border"
              }`}
            >
              <Image src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
