import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import { FREE_DELIVERY_THRESHOLD, listCities } from "@/lib/delivery";

const STORE_POLICIES = `
STORE POLICIES
- Payment: Cash on Delivery (pay when the order arrives), or Bank Transfer / JazzCash / Easypaisa (customer sends a screenshot of the payment after ordering).
- Every order starts as PENDING and is confirmed by the store over WhatsApp before it ships — this is normal, not a delay tactic.
- Delivery fee depends on city and is shown at checkout; orders above ${formatPKR(FREE_DELIVERY_THRESHOLD)} get free delivery.
- Customers can track an order anytime at /track-order using the phone number they checked out with.
- Gift-ready packaging is available — customers can add a note at checkout.
- No customer accounts are needed — checkout is guest-only (name, phone, address, city).
- For anything the assistant can't resolve (sizing, custom orders, complaints, order changes after placing), tell the customer to message the store on WhatsApp using the "Order on WhatsApp" button on the site.
`.trim();

/**
 * Builds the grounding context for the support chatbot: current products,
 * collections and delivery rates pulled live from the database, plus static
 * store policy text. The catalog is small enough (a couple dozen items) to
 * include in full on every request, which is simpler and more accurate here
 * than embedding-based retrieval. If the catalog grows into the hundreds,
 * replace this with a real vector search (e.g. pgvector) over product
 * embeddings — the chat route only depends on this function returning a
 * text block, so that swap wouldn't touch anything else.
 */
export async function buildStoreContext(): Promise<string> {
  const [products, collections, cities] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        category: true,
        material: true,
        collection: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.collection.findMany({ select: { name: true, slug: true, description: true } }),
    listCities(),
  ]);

  const productLines = products.map((p) => {
    const stockNote = p.stock === 0 ? "OUT OF STOCK" : `${p.stock} in stock`;
    const saleNote =
      p.compareAtPrice && p.compareAtPrice > p.price
        ? ` (was ${formatPKR(p.compareAtPrice)})`
        : "";
    return `- [${p.name}](/products/${p.slug}) — ${formatPKR(p.price)}${saleNote}, ${stockNote}. Category: ${p.category ?? "—"}. Collection: ${p.collection?.name ?? "—"}. Material: ${p.material ?? "—"}. ${p.description}`;
  });

  const collectionLines = collections.map(
    (c) => `- [${c.name}](/collections/${c.slug})${c.description ? `: ${c.description}` : ""}`
  );

  const cityLines = cities.map((c) => `- ${c.city}: ${formatPKR(c.fee)} delivery`);

  return `
CURRENT PRODUCTS (${products.length} active)
${productLines.join("\n") || "No products currently active."}

COLLECTIONS
${collectionLines.join("\n") || "None."}

DELIVERY FEES BY CITY
${cityLines.join("\n")}

${STORE_POLICIES}
`.trim();
}
