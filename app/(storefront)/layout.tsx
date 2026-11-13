import type { Metadata } from "next";
import { Jost, Playfair_Display } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatWidgetServer from "@/components/ChatWidgetServer";
import ScrollProgressBar from "@/components/motion/ScrollProgressBar";

const sans = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const SITE_DESCRIPTION =
  "Handpicked jewellery for daily wear, western and bridal looks: earrings, rings, bangles, necklaces and bridal sets. Cash on delivery across Pakistan.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Joyería Studio — Artificial Jewelry, Pakistan",
    template: "%s | Joyería Studio",
  },
  description: SITE_DESCRIPTION,
  // The preview card when the site is shared on WhatsApp, Facebook, Instagram
  // and others. Pages with their own photo (products) override `images`.
  openGraph: {
    type: "website",
    siteName: "Joyería Studio",
    locale: "en_PK",
    title: "Joyería Studio — Handpicked Jewellery, Pakistan",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og/joyeria-studio-share.jpg",
        width: 1200,
        height: 630,
        alt: "Joyería Studio — handpicked jewellery for daily wear, western and bridal looks",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Joyería Studio — Handpicked Jewellery, Pakistan",
    description: SITE_DESCRIPTION,
    images: ["/og/joyeria-studio-share.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ScrollProgressBar />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ChatWidgetServer />
      </body>
    </html>
  );
}
