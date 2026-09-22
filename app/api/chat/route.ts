import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { chatRequestSchema } from "@/lib/validation";
import { buildStoreContext } from "@/lib/chat-context";
import { isRateLimited } from "@/lib/rate-limit";

const SYSTEM_PROMPT_PREFIX = `You are the shopping assistant for Joyería Studio, an online artificial jewelry store in Pakistan (daily wear, western and bridal pieces).

Answer only using the store information below — never invent a product, price, stock count or policy that isn't listed. If a customer asks about something not covered here (sizing advice, a custom order, a complaint, changing an order after it's placed), tell them to message the store on WhatsApp using the "Order on WhatsApp" button on the site.

Keep replies short (2-4 sentences), warm, and in the customer's language if they write in Urdu or Roman Urdu. Prices are in PKR. When recommending a product, name it plainly (the site will link it automatically).

STORE INFORMATION:
`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Chat support isn't set up yet — please message us on WhatsApp instead.",
      },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(`chat:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  }

  try {
    const context = await buildStoreContext();
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT_PREFIX + context,
      messages: parsed.data.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return NextResponse.json({ reply: reply || "Sorry, I couldn't come up with a reply — please try again." });
  } catch (err) {
    console.error("Chat request failed", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or message us on WhatsApp." },
      { status: 500 }
    );
  }
}
