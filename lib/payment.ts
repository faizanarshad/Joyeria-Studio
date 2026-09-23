// There's no payment gateway wired up (see README) — "advance payment" above
// this threshold means the order is paid upfront via bank transfer, JazzCash
// or Easypaisa (screenshot confirmed over WhatsApp) rather than cash on
// delivery, not a partial deposit with COD for the remainder. Full prepay is
// the strongest version of "advance payment required," and the simplest one
// this app can actually enforce without building real payment processing.
export const ADVANCE_PAYMENT_THRESHOLD = Number(process.env.ADVANCE_PAYMENT_THRESHOLD ?? 5000);

export function codAllowed(total: number): boolean {
  return total < ADVANCE_PAYMENT_THRESHOLD;
}
