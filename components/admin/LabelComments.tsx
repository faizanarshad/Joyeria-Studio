"use client";

import { useState } from "react";

// A comments box on the parcel label. Type into it before printing (e.g.
// "Fragile", "Call before delivery") or leave it empty and write by hand on
// the printed label. It is not saved — it only affects this printout.
export default function LabelComments() {
  const [text, setText] = useState("");
  return (
    <textarea
      value={text}
      onChange={(e) => setText(e.target.value)}
      rows={2}
      maxLength={140}
      aria-label="Comments to print on the label"
      placeholder="Type a comment to print, or leave blank to write by hand"
      className="mt-0.5 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[9.5pt] leading-snug text-black outline-none placeholder:text-[8pt] placeholder:text-black/40 print:placeholder:text-transparent"
    />
  );
}
