// The studio's WhatsApp Business number. Every "Order on WhatsApp", chat and
// order-confirmation link on the site points here.
export const STUDIO_WHATSAPP_NUMBER = "923394101341"; // international form, digits only
export const STUDIO_WHATSAPP_DISPLAY = "0339 4101341"; // how it's shown to customers

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${STUDIO_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function productWhatsAppMessage(productName: string, price: number): string {
  return `Hi! I'm interested in "${productName}" (Rs ${price.toLocaleString("en-PK")}). Is it available?`;
}

export function orderWhatsAppMessage(orderNumber: string): string {
  return `Hi! I just placed order ${orderNumber} on Joyería Studio and I'd like to confirm it.`;
}
