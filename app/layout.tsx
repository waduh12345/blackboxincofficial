import type { Metadata } from "next";
// Mengganti Geist dengan Barlow (mirip DIN/Uniqlo)
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/providers/redux";
import WhatsAppFloat from "@/components/whatsapp-float";

// Font utama untuk body text (mirip DIN)
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow-condensed",
});

const siteDescription =
  "Temukan koleksi terbaru BLACKBOX.INC, Toko pakaian outfit stylish & sneakers ORIGINAL & NEW EST 2018 tren terbaru tersedia dengan harga affordable";

export const metadata: Metadata = {
  metadataBase: new URL("https://blackboxincofficial.com"),
  title: "BLACKBOX.INC",
  description: siteDescription,
  icons: {
    icon: "/images/new/logo/BLACKBOXINC-Shop.png",
  },
  openGraph: {
    title: "BLACKBOX.INC",
    description: siteDescription,
    type: "website",
    siteName: "BLACKBOX.INC",
  },
  twitter: {
    card: "summary_large_image",
    title: "BLACKBOX.INC",
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${barlow.variable} ${barlowCondensed.variable} antialiased font-sans`}
      >
        <ReduxProvider>{children}</ReduxProvider>
        <WhatsAppFloat />
      </body>
    </html>
  );
}