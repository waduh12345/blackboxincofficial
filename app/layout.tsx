import type { Metadata } from "next";
// Mengganti Geist dengan Barlow (mirip DIN/Uniqlo)
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/providers/redux";

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

export const metadata: Metadata = {
  title: "BLACKBOX.INC",
  description: "Raih Kulit Sehat & Bersinar dengan BLACKBOX.INC Shop",
  icons: {
    icon: "/images/new/logo/BLACKBOXINC-Shop.png",
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
      </body>
    </html>
  );
}