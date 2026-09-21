import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatPKR } from "@/lib/format";
import { orderWhatsAppMessage } from "@/lib/whatsapp";
import WhatsAppButton from "@/components/WhatsAppButton";

type Props = { params: Promise<{ orderNumber: string }> };

export default async function OrderSuccessPage({ params }: Props) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose/10 text-2xl text-rose-dark">
        ✓
      </div>
      <h1 className="mt-4 font-display text-2xl text-foreground">Order Placed!</h1>
      <p className="mt-2 text-muted">
        Order <span className="font-medium text-foreground">{order.orderNumber}</span> has been
        received and is pending confirmation.
      </p>

      <div className="mt-8 rounded-lg border border-border p-6 text-left">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
            <span>
              {item.productName} x{item.quantity}
            </span>
            <span>{formatPKR(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-muted">Delivery</span>
          <span>{formatPKR(order.deliveryFee)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted">Discount</span>
            <span>-{formatPKR(order.discount)}</span>
          </div>
        )}
        <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium">
          <span>Total</span>
          <span>{formatPKR(order.total)}</span>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">
        We confirm every order over WhatsApp before shipping — tap below to speed that up.
      </p>
      <WhatsAppButton message={orderWhatsAppMessage(order.orderNumber)} className="mt-3 w-full">
        Confirm on WhatsApp
      </WhatsAppButton>

      <Link href="/" className="mt-6 inline-block text-sm text-rose-dark hover:underline">
        Continue Shopping
      </Link>
    </div>
  );
}
