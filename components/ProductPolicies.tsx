import { formatPKR } from "@/lib/format";
import { RETURN_POLICY, CARE_INSTRUCTIONS } from "@/lib/policies";
import { ADVANCE_PAYMENT_THRESHOLD } from "@/lib/payment";

export default function ProductPolicies({ careNote }: { careNote?: string | null }) {
  return (
    <div className="mt-8 divide-y divide-border border-t border-b border-border text-sm">
      <details className="group py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
          Returns &amp; Exchanges
          <span className="text-muted transition-transform group-open:rotate-45">+</span>
        </summary>
        <p className="mt-3 leading-relaxed text-foreground/70">{RETURN_POLICY}</p>
      </details>

      <details className="group py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
          Jewelry Care
          <span className="text-muted transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="mt-3 space-y-2 leading-relaxed text-foreground/70">
          {careNote && <p>{careNote}</p>}
          <p>{CARE_INSTRUCTIONS}</p>
        </div>
      </details>

      <details className="group py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-foreground">
          Payment
          <span className="text-muted transition-transform group-open:rotate-45">+</span>
        </summary>
        <p className="mt-3 leading-relaxed text-foreground/70">
          Cash on delivery is available on orders under {formatPKR(ADVANCE_PAYMENT_THRESHOLD)}.
          Orders at or above that need advance payment — bank transfer, JazzCash or Easypaisa,
          confirmed by a WhatsApp screenshot — before we ship.
        </p>
      </details>
    </div>
  );
}
