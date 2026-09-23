import { buildWhatsAppLink } from "@/lib/whatsapp";

const VARIANTS = {
  solid: "bg-[#25D366] text-white hover:brightness-95",
  outline: "border border-foreground/20 text-foreground hover:bg-black/5",
  // For a photo-background hero — "outline" reads as dark-on-light and
  // disappears against a dark backdrop.
  outlineLight: "border border-white/40 text-white hover:bg-white/10",
};

export default function WhatsAppButton({
  message,
  className = "",
  variant = "solid",
  children = "Order on WhatsApp",
}: {
  message: string;
  className?: string;
  variant?: keyof typeof VARIANTS;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={buildWhatsAppLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </a>
  );
}
