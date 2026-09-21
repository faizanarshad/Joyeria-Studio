const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923001234567";

export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function productWhatsAppMessage(productName: string, price: number): string {
  return `Hi! I'm interested in "${productName}" (Rs ${price.toLocaleString("en-PK")}). Is it available?`;
}

export function orderWhatsAppMessage(orderNumber: string): string {
  return `Hi! I just placed order ${orderNumber} on Joyería Studio and I'd like to confirm it.`;
}
