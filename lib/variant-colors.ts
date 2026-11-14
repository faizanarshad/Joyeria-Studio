// Swatch fills for colour options. Unknown names fall back to a neutral grey,
// so an admin can add a new colour without touching this file.
const SWATCHES: Record<string, string> = {
  multicolour: "conic-gradient(#e8699e, #f07018, #eec01c, #0e8e48, #184ac4, #6b3fa0, #e8699e)",
  "ruby & emerald": "linear-gradient(135deg, #b81028 50%, #0e8e48 50%)",
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
  // Stone colours (e.g. the Bel vine bracelet)
  "rose quartz": "#e9b9bf",
  mint: "#7fcfab",
  sapphire: "#2f4fa8",
  "lavender & green": "linear-gradient(135deg, #d8cbe6 50%, #1e8a4c 50%)",
  "opal white": "#ece6ee",
  ruby: "#a3133a",
  champagne: "#e7c3a1",
  "crystal & green": "linear-gradient(135deg, #f2f2f2 50%, #1e8a4c 50%)",
  blush: "#f0c4c6",
  "smoky quartz": "#b9b4a8",
  emerald: "#127a46",
};

export function swatchFor(color: string): string {
  return SWATCHES[color.trim().toLowerCase().replace("multicolor", "multicolour")] ?? "#b8b2a8";
}
