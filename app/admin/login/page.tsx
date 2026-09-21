import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="font-display text-2xl text-foreground">Joyería Studio Admin</h1>
      <p className="mt-1 text-sm text-muted">Sign in to manage orders and products.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
