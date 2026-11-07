// Swatch fills for colour options. Unknown names fall back to a neutral grey,
// so an admin can add a new colour without touching this file.
const SWATCHES: Record<string, string> = {
  multicolour: "conic-gradient(#1f1f22, #0e8e48, #b81028, #9be0c4, #e8699e, #1f1f22)",
  black: "#1f1f22",
  pink: "#e8699e",
  red: "#b81028",
  yellow: "#eec01c",
  orange: "#f07018",
  green: "#0e8e48",
  blue: "#184ac4",
  white: "#f4f1ea",
  gold: "#d4af37",
  silver: "#c0c0c0",
  purple: "#6b3fa0",
  maroon: "#6d1a2a",
};

export function swatchFor(color: string): string {
  return SWATCHES[color.trim().toLowerCase().replace("multicolor", "multicolour")] ?? "#b8b2a8";
}
