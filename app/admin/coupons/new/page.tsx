import CouponForm from "@/components/admin/CouponForm";

export const metadata = { title: "New Coupon" };

export default function NewCouponPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-foreground">New Coupon</h1>
      <div className="mt-6">
        <CouponForm />
      </div>
    </div>
  );
}
