import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { OCCASIONS } from "@/lib/outfit-style";

const ALLOWED_TYPES: Record<string, "image/jpeg" | "image/png" | "image/webp"> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

// Structured output: the API constrains the reply to this schema, so there's
// no JSON to fish out of free text.
const OutfitReading = z.object({
  occasion: z.enum(OCCASIONS),
  colors: z.array(z.string()),
  reason: z.string(),
});

const PROMPT = `Look at this photo of an outfit (worn, on a hanger, or laid out as a flatlay). Pick the one occasion it suits best:
- "daily": everyday or office wear. Simple, minimal or professional styling in plain or lightly patterned fabric, however many separate items are in the shot. Judge the garment, not how many objects are in the photo.
- "party": going-out or festive wear (dinners, parties, Eid, a wedding guest look). Dressier than daily wear, with some embroidery, sequins, zari or rich fabric, but not bridal.
- "mehndi": a mehndi, haldi or dholki look. Bright festive colours (yellow, green, orange, hot pink or multicolour), often with gota, mirror work or floral prints.
- "bridal": the bride's own wedding outfit (baraat, nikkah, walima). Dense embroidery, stonework or zari on heavy fabric, clearly bridal-grade.

List the 1-3 main colours of the garment itself, in plain English (for example "maroon", "mint green", "gold embroidery"); ignore the background and props.

Give a short, friendly reason (one sentence, under 25 words) that a shopper will read.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Outfit matching isn't set up yet. Pick an occasion yourself below instead." },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await checkRateLimit(`outfit-style:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment and try again." }, { status: 429 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }
  const mediaType = ALLOWED_TYPES[file.type];
  if (!mediaType) {
    return NextResponse.json({ error: "Use a JPEG, PNG or WebP image" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 8MB" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.parse({
      // A fast, low-cost vision model: the shopper is waiting on this.
      model: "claude-haiku-5-5",
      max_tokens: 4000,
      output_config: { effort: "low", format: zodOutputFormat(OutfitReading) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") } },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      throw new Error(`No outfit reading (stop_reason: ${response.stop_reason})`);
    }
    const { occasion, colors, reason } = response.parsed_output;
    return NextResponse.json({ occasion, colors: colors.slice(0, 3), reason });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "We're busy right now. Please try again in a moment." }, { status: 429 });
    }
    console.error("Outfit style classification failed", err);
    return NextResponse.json(
      { error: "Couldn't read that photo. Please try again or pick an occasion yourself below." },
      { status: 502 }
    );
  }
}
