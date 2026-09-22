import { listCities, FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const cities = await listCities();
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl text-foreground">Checkout</h1>
      <CheckoutForm cities={cities} freeDeliveryThreshold={FREE_DELIVERY_THRESHOLD} />
    </div>
  );
}
