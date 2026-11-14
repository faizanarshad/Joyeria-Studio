import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPKR } from "@/lib/format";
import { STUDIO_NAME, STUDIO_PHONE_DISPLAY, studioReturnAddress } from "@/lib/studio";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Parcel Label" };

type Props = { params: Promise<{ id: string }> };

const PAYMENT_LABEL: Record<string, string> = {
  BANK_TRANSFER: "Bank Transfer",
  JAZZCASH: "JazzCash",
  EASYPAISA: "Easypaisa",
};

// A 100 × 150 mm (4 × 6 in) shipping label — the standard thermal-label size,
// and small enough to print on A4 and cut out. Everything sits inside a 4 mm
// inset so an ordinary printer's unprintable edge never clips the border.
export default async function OrderLabelPage({ params }: Props) {
  // The proxy already keeps signed-out visitors off /admin; this page prints a
  // customer's name, phone and address, so it checks for itself as well.
  const session = await auth();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const trackUrl = `${siteUrl}/track-order?phone=${order.phone}`;
  const qrSvg = await QRCode.toString(trackUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M" });

  const isCod = order.paymentMethod === "COD";
  const totalPieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  // Long orders drop to a smaller item font so the label still fits one page.
  const compact = order.items.length > 4;
  const returnAddress = studioReturnAddress();
  const placed = order.createdAt.toLocaleDateString("en-PK", {
    timeZone: "Asia/Karachi",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div>
      <style>{`
        @page { margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          .parcel-label { margin: 0 !important; box-shadow: none !important; }
        }
        .parcel-label { width: 100mm; min-height: 150mm; padding: 4mm; }
        .parcel-label svg { display: block; width: 100%; height: 100%; }
      `}</style>

      <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
        <PrintButton>Print label</PrintButton>
        <Link href="/admin/orders" className="text-sm text-muted hover:text-rose-dark">
          ← Back to orders
        </Link>
        <p className="w-full text-xs text-muted">
          Sized for a 100 × 150 mm (4 × 6 in) label. On A4, print at 100% scale and cut it out. In
          the print dialog, turn off &ldquo;Headers and footers&rdquo;.
        </p>
      </div>

      <div className="parcel-label mx-auto bg-white font-sans text-black shadow-md">
        <div className="flex min-h-[142mm] flex-col border-2 border-black text-[10pt] leading-snug">
          {/* Order reference */}
          <div className="flex items-center justify-between border-b-2 border-black px-3 py-1.5">
            <span className="font-display text-[13pt] font-semibold">{STUDIO_NAME}</span>
            <span className="text-right">
              <span className="block text-[13pt] font-bold tracking-wide">{order.orderNumber}</span>
              <span className="block text-[8pt]">{placed}</span>
            </span>
          </div>

          {/* Receiver */}
          <div className="border-b-2 border-black px-3 py-1.5">
            <p className="text-[7.5pt] font-semibold uppercase tracking-widest">Deliver to</p>
            <p className="mt-0.5 text-[15pt] font-bold leading-tight">{order.customerName}</p>
            <p className="mt-0.5 whitespace-pre-line text-[10.5pt]">{order.address}</p>
            <p className="text-[12pt] font-bold uppercase">{order.city}</p>
            <p className="mt-0.5 text-[12pt]">
              Contact: <span className="font-bold tracking-wide">{order.phone}</span>
            </p>
          </div>

          {/* Sender */}
          <div className="border-b-2 border-black px-3 py-1.5">
            <p className="text-[9pt]">
              <span className="mr-1.5 text-[7.5pt] font-semibold uppercase tracking-widest">From</span>
              <span className="font-semibold">{STUDIO_NAME}</span> · Contact: {STUDIO_PHONE_DISPLAY}
            </p>
            {returnAddress && <p className="whitespace-pre-line text-[9pt]">{returnAddress}</p>}
          </div>

          {/* Contents */}
          <div className="flex-1 border-b-2 border-black px-3 py-1.5">
            <table className={`w-full ${compact ? "text-[8pt]" : "text-[9.5pt]"}`}>
              <thead>
                <tr className="border-b border-black text-left text-[7.5pt] uppercase tracking-widest">
                  <th className="pb-1 font-semibold">
                    Item <span className="font-normal normal-case tracking-normal">({totalPieces} {totalPieces === 1 ? "piece" : "pieces"} in parcel)</span>
                  </th>
                  <th className="w-10 pb-1 text-right font-semibold">Qty</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-black/20 align-top last:border-0">
                    <td className={`pr-2 ${compact ? "py-px" : "py-0.5"}`}>
                      {item.productName}
                      {item.color ? ` — ${item.color}` : ""}
                    </td>
                    <td className={`text-right font-bold ${compact ? "py-px" : "py-0.5"}`}>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {order.note && <p className="mt-1 text-[8.5pt] italic">Note: {order.note}</p>}
          </div>

          {/* Payment + tracking QR */}
          <div className="flex items-stretch">
            <div className="flex flex-1 flex-col justify-center px-3 py-1.5">
              {isCod ? (
                <>
                  <p className="text-[8pt] font-semibold uppercase tracking-widest">
                    Cash on delivery — collect
                  </p>
                  <p className="text-[20pt] font-bold leading-none">{formatPKR(order.total)}</p>
                </>
              ) : (
                <>
                  <p className="text-[16pt] font-bold leading-none">PREPAID</p>
                  <p className="mt-1 text-[8.5pt]">
                    {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod} ·{" "}
                    {formatPKR(order.total)} · nothing to collect
                  </p>
                </>
              )}
              {(order.courierName || order.trackingNumber) && (
                <p className="mt-1.5 text-[8.5pt]">
                  {order.courierName ?? "Courier"}
                  {order.trackingNumber ? ` · ${order.trackingNumber}` : ""}
                </p>
              )}
            </div>
            <div className="flex w-[26mm] flex-col items-center border-l-2 border-black p-1.5">
              <div
                className="h-[20mm] w-[20mm]"
                role="img"
                aria-label={`QR code to track order ${order.orderNumber}`}
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <p className="mt-0.5 text-center text-[6.5pt] uppercase tracking-wider">Scan to track</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
