export type RGB = { r: number; g: number; b: number };
export type Warmth = "warm" | "cool" | "neutral";
export type Depth = "light" | "dark" | "medium";

export type OutfitPalette = {
  warmth: Warmth;
  depth: Depth;
  swatches: string[]; // hex, largest cluster first — shown back to the customer for trust
};

function toHex({ r, g, b }: RGB): string {
  const h = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

function dist2(a: RGB, b: RGB): number {
  return (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2;
}

function rgbToHsl({ r, g, b }: RGB): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return { h, s, l };
}

const FALLBACK_PALETTE: OutfitPalette = { warmth: "neutral", depth: "medium", swatches: [] };

/** Reads pixels from a downsampled, lightly center-cropped draw of the image
 * and runs a small k-means pass to find dominant colors. This is the one
 * part of outfit matching that's genuinely reliable client-side — occasion
 * (daily/party/bridal) needs real image understanding and is handled by the
 * /api/outfit-style route instead; an earlier edge-density heuristic here
 * for that was scrapped after failing on real photos (a plain office flatlay
 * with several objects reads just as "busy" as a heavily embroidered dress
 * when you're only measuring pixel-to-pixel contrast). */
export function extractPalette(img: HTMLImageElement, k = 5): OutfitPalette {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return FALLBACK_PALETTE;

  // A light center-crop of the source image before downsampling — outfit
  // photos often have background (wall, floor, backdrop) at the edges, and
  // this cheaply favors whatever's in the middle of the frame without doing
  // real subject segmentation.
  const cropFrac = 0.8;
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  const cw = sw * cropFrac;
  const ch = sh * cropFrac;
  const sx = (sw - cw) / 2;
  const sy = (sh - ch) / 2;
  ctx.drawImage(img, sx, sy, cw, ch, 0, 0, size, size);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, size, size).data;
  } catch {
    // A cross-origin image without CORS headers taints the canvas — can't
    // read it back. Caller falls back to a neutral palette in that case.
    return FALLBACK_PALETTE;
  }

  const pixels: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // skip transparent
    pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  if (pixels.length === 0) return FALLBACK_PALETTE;

  let centroids = Array.from({ length: k }, (_, i) => pixels[Math.floor((i / k) * pixels.length)]);
  const assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < 6; iter++) {
    for (let i = 0; i < pixels.length; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = dist2(pixels[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      assignments[i] = best;
    }
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c].r += pixels[i].r;
      sums[c].g += pixels[i].g;
      sums[c].b += pixels[i].b;
      sums[c].count++;
    }
    centroids = sums.map((s, idx) => (s.count > 0 ? { r: s.r / s.count, g: s.g / s.count, b: s.b / s.count } : centroids[idx]));
  }

  const counts = new Array(centroids.length).fill(0);
  assignments.forEach((a) => counts[a]++);
  const clusters = centroids
    .map((color, i) => ({ color, weight: counts[i] }))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  // Weighted-circular hue average and mean lightness/saturation across
  // clusters, weighted by how many pixels landed in each one.
  const totalWeight = clusters.reduce((sum, c) => sum + c.weight, 0);
  let sumSin = 0;
  let sumCos = 0;
  let sumS = 0;
  let sumL = 0;
  for (const { color, weight } of clusters) {
    const { h, s, l } = rgbToHsl(color);
    const rad = (h * Math.PI) / 180;
    sumSin += Math.sin(rad) * weight;
    sumCos += Math.cos(rad) * weight;
    sumS += s * weight;
    sumL += l * weight;
  }
  const avgHue = ((Math.atan2(sumSin, sumCos) * 180) / Math.PI + 360) % 360;
  const avgSat = sumS / totalWeight;
  const avgLight = sumL / totalWeight;

  const warmth: Warmth =
    avgSat < 0.12
      ? "neutral" // low saturation — greys/near-black/near-white carry no hue signal
      : avgHue <= 70 || avgHue >= 320
        ? "warm" // reds, oranges, yellows, pinks/magentas
        : avgHue >= 150 && avgHue <= 280
          ? "cool" // greens, blues, purples
          : "neutral";

  const depth: Depth = avgLight < 0.35 ? "dark" : avgLight > 0.68 ? "light" : "medium";

  return { warmth, depth, swatches: clusters.slice(0, 5).map((c) => toHex(c.color)) };
}

export const OCCASIONS = ["daily", "party", "mehndi", "bridal"] as const;
export type Occasion = (typeof OCCASIONS)[number];

export const OCCASION_OPTIONS: { value: Occasion; label: string }[] = [
  { value: "daily", label: "Daily & Office" },
  { value: "party", label: "Party Wear" },
  { value: "mehndi", label: "Mehndi" },
  { value: "bridal", label: "Wedding" },
];

export type StyleProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  category: string | null;
  material: string | null;
  finish: string | null;
  isFeatured: boolean;
  tryOnImageUrl: string | null;
  coverImage: string;
  coverImageAlt: string;
  collectionSlug: string | null;
  occasionTags: string[];
  colorTags: string[];
  colorCount?: number;
};

// --- Colour families -------------------------------------------------------
// Outfit colours arrive as free text from the photo reading ("mint green",
// "maroon") or as hex swatches; products carry colour tags from the admin
// ("Green", "Red", "Multicolor"). Both are reduced to the same few families.

export type ColorFamily =
  | "red" | "pink" | "orange" | "yellow" | "green" | "blue" | "purple"
  | "black" | "white" | "gold" | "silver" | "multicolor";

const FAMILY_WORDS: [ColorFamily, string[]][] = [
  ["multicolor", ["multi", "rainbow"]],
  ["gold", ["gold", "golden", "zari"]],
  ["silver", ["silver", "grey", "gray", "metallic"]],
  ["pink", ["pink", "blush", "rose", "magenta", "fuchsia", "peach"]],
  ["red", ["red", "maroon", "burgundy", "wine", "ruby", "crimson", "rust"]],
  ["orange", ["orange", "coral", "saffron", "tangerine"]],
  ["yellow", ["yellow", "mustard", "lemon", "haldi"]],
  ["green", ["green", "emerald", "mint", "olive", "sage", "pista", "bottle"]],
  ["blue", ["blue", "navy", "teal", "turquoise", "aqua", "sky", "cobalt"]],
  ["purple", ["purple", "lilac", "lavender", "violet", "plum", "mauve"]],
  ["black", ["black", "charcoal", "jet"]],
  ["white", ["white", "ivory", "cream", "off-white", "pearl", "beige"]],
];

export function colorFamilyOf(name: string): ColorFamily | null {
  const n = name.toLowerCase();
  for (const [family, words] of FAMILY_WORDS) {
    if (words.some((w) => n.includes(w))) return family;
  }
  return null;
}

/** Families for hex swatches, used when there's no photo reading to go on. */
export function colorFamilyOfHex(hex: string): ColorFamily | null {
  const v = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(v)) return null;
  const { h, s, l } = rgbToHsl({ r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 });
  if (l < 0.15) return "black";
  if (l > 0.88 || s < 0.12) return l > 0.6 ? "white" : null;
  if (h < 15 || h >= 345) return l > 0.7 ? "pink" : "red";
  if (h < 40) return "orange";
  if (h < 65) return "yellow";
  if (h < 170) return "green";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "pink";
}

// --- Scoring ---------------------------------------------------------------

// What each occasion looks for. Occasion tags are what the shop sets on each
// product (Daily, Office, Party Wear, Mehndi, Wedding); the collection is a
// weaker hint for pieces that haven't been tagged.
const OCCASION_RULES: Record<Occasion, { tags: string[]; collections: string[]; avoidCollections: string[] }> = {
  daily: { tags: ["Daily", "Office"], collections: ["daily-wear", "western"], avoidCollections: ["bridal"] },
  party: { tags: ["Party Wear"], collections: ["western", "bridal"], avoidCollections: [] },
  mehndi: { tags: ["Mehndi"], collections: ["bridal"], avoidCollections: [] },
  bridal: { tags: ["Wedding"], collections: ["bridal"], avoidCollections: ["daily-wear", "western"] },
};

function finishWarmth(finish: string | null): Warmth {
  const f = (finish ?? "").toLowerCase();
  if (f.includes("gold")) return "warm";
  if (f.includes("oxid") || f.includes("silver")) return "cool";
  return "neutral";
}

function materialDepth(material: string | null): Depth {
  const m = (material ?? "").toLowerCase();
  if (m.includes("oxid")) return "dark";
  if (["pearl", "zircon", "crystal", "polki", "shell"].some((w) => m.includes(w))) return "light";
  return "medium";
}

export type OutfitSignals = {
  palette: OutfitPalette | null;
  // Colour families of the outfit itself, most prominent first.
  colors: ColorFamily[];
};

/** Rule-based, transparent scoring. Occasion is the dominant signal, since a
 * bridal set is wrong for an office look whatever its colour; the outfit's
 * colours then pick the best pieces within it. Nothing is excluded outright,
 * so a small catalogue still fills the grid. */
export function scoreProduct(p: StyleProduct, occasion: Occasion, signals: OutfitSignals): number {
  const rule = OCCASION_RULES[occasion];
  let score = 0;

  if (p.occasionTags.some((t) => rule.tags.includes(t))) score += 8;
  if (p.collectionSlug && rule.collections.includes(p.collectionSlug)) score += 2;
  if (p.collectionSlug && rule.avoidCollections.includes(p.collectionSlug)) score -= 6;

  // Gold is the near-universal choice for festive and bridal jewellery here,
  // whatever the outfit's own colour.
  if (occasion !== "daily" && finishWarmth(p.finish) === "warm") score += 1.5;

  // Colour: a piece that carries one of the outfit's colours ties the look
  // together; multicolour pieces suit bright, mixed outfits.
  const tagFamilies = new Set(p.colorTags.map(colorFamilyOf).filter((f): f is ColorFamily => !!f));
  const accents = signals.colors.filter((f) => f !== "gold" && f !== "silver");
  accents.forEach((f, i) => {
    if (tagFamilies.has(f)) score += i === 0 ? 4 : 2.5;
  });
  if (tagFamilies.has("multicolor") && (accents.length >= 2 || occasion === "mehndi")) score += 1.5;
  if (signals.colors.includes("silver") && finishWarmth(p.finish) === "cool") score += 2;

  if (signals.palette) {
    const fw = finishWarmth(p.finish);
    if (fw === signals.palette.warmth) score += 1;
    if (materialDepth(p.material) === signals.palette.depth) score += 0.5;
  }

  if (p.isFeatured) score += 0.5;
  return score;
}

export function rankProducts(products: StyleProduct[], occasion: Occasion, signals: OutfitSignals): StyleProduct[] {
  return products
    .filter((p) => p.stock > 0)
    .map((p) => ({ p, s: scoreProduct(p, occasion, signals) }))
    .sort((a, b) => b.s - a.s)
    .map(({ p }) => p);
}

/** The outfit's colour families: from the photo reading when there is one,
 * otherwise from the extracted swatches. */
export function outfitColorFamilies(readColors: string[], palette: OutfitPalette | null): ColorFamily[] {
  const fromText = readColors.map(colorFamilyOf).filter((f): f is ColorFamily => !!f);
  const fromHex = readColors.length > 0 ? [] : (palette?.swatches ?? []).map(colorFamilyOfHex).filter((f): f is ColorFamily => !!f);
  return [...new Set([...fromText, ...fromHex])];
}
