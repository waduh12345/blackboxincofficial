"use client";

import Link from "next/link";
import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

const infoLinks = [
  { label: "ABOUT US", href: "/about" },
  { label: "HOW TO ORDER", href: "/how-to-order" },
  {
    label: "OFFICIAL INSTAGRAM",
    href: "https://www.instagram.com/BLACKBOXINC_Shop?igsh=MTN4MTE0anA2aXB4aA==",
    external: true,
  },
  {
    label: "MAPS BLACKBOXINC STORE",
    href: "https://maps.google.com/?q=BLACKBOXINC+Shop",
    external: true,
  },
];

const policyLinks = [
  { label: "Persyaratan Layanan", href: "/terms" },
  { label: "Kebijakan Privasi", href: "/privacy" },
  { label: "Kebijakan Pengiriman", href: "/shipping-policy" },
  { label: "Kebijakan Pengembalian", href: "/refund-policy" },
  { label: "Kebijakan Kekayaan Intelektual", href: "/ip-policy" },
];

// tambahkan di atas / dekat daftar logo
const QRIS_SVG =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='40' viewBox='0 0 160 40' aria-label='QRIS logo'%3E%3Crect fill='none' width='160' height='40'/%3E%3Ctext x='10' y='27' font-family='Inter,Arial,sans-serif' font-weight='800' font-size='22' fill='%23111'%3EQRIS%3C/text%3E%3C/svg%3E";

// ✅ URL publik (aman dipakai langsung)
const paymentLogos = [
  { alt: "QRIS", src: QRIS_SVG },
  { alt: "OVO", src: "https://logo.clearbit.com/ovo.id" },
  { alt: "Akulaku", src: "https://logo.clearbit.com/akulaku.com" },
  { alt: "Alfamart", src: "https://logo.clearbit.com/alfamart.co.id" },
  { alt: "BCA", src: "https://logo.clearbit.com/bca.co.id" },
  { alt: "Mandiri", src: "https://logo.clearbit.com/bankmandiri.co.id" },
  { alt: "BRI", src: "https://logo.clearbit.com/bri.co.id" },
  { alt: "BNI", src: "https://logo.clearbit.com/bni.co.id" },
  { alt: "PermataBank", src: "https://logo.clearbit.com/permatabank.com" },
  { alt: "Danamon", src: "https://logo.clearbit.com/danamon.co.id" },
  { alt: "BSI", src: "https://logo.clearbit.com/bankbsi.co.id" },
  { alt: "CIMB Niaga", src: "https://logo.clearbit.com/cimbniaga.co.id" },
  { alt: "VISA", src: "https://logo.clearbit.com/visa.com" },
  { alt: "JCB", src: "https://logo.clearbit.com/jcb.co.jp" },
  { alt: "Mastercard", src: "https://logo.clearbit.com/mastercard.com" },
];

const shippingLogos = [
  { alt: "JNE", src: "https://logo.clearbit.com/jne.co.id" },
  { alt: "GoSend", src: "https://logo.clearbit.com/gojek.com" }, // GoSend milik Gojek
  { alt: "SiCepat", src: "https://logo.clearbit.com/sicepat.com" },
];

export default function Footer() {
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer className="relative bg-neutral-100 text-neutral-800 dark:bg-zinc-950 dark:text-zinc-200 border-t border-neutral-200/70 dark:border-zinc-800">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-zinc-700" />

      {/* main */}
      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* kiri */}
          <div className="md:col-span-4">
            <nav aria-label="Informasi">
              <ul className="space-y-3">
                {infoLinks.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      target={l.external ? "_blank" : undefined}
                      rel={l.external ? "noopener noreferrer" : undefined}
                      className="group inline-flex items-baseline gap-2 font-semibold tracking-wide text-neutral-900 dark:text-zinc-100"
                    >
                      <span className="underline decoration-2 underline-offset-4 group-hover:decoration-4">
                        {l.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* tengah */}
          <div className="md:col-span-4">
            <section className="space-y-6">
              <h3 className="text-lg font-semibold">Metode Pembayaran</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                {paymentLogos.map((logo) => (
                  <div
                    key={logo.alt}
                    className="flex items-center justify-center rounded-xl bg-white/70 dark:bg-white/5 border border-neutral-200/70 dark:border-zinc-700 p-3 shadow-sm hover:shadow-md transition-all"
                    title={logo.alt}
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      width={80}
                      height={28}
                      className="h-7 w-auto object-contain grayscale opacity-80 hover:opacity-100 transition"
                      onError={(e) => {
                        e.currentTarget.style.filter = "grayscale(0)";
                        e.currentTarget.style.opacity = "0.6";
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <h4 className="text-lg font-semibold mb-4">
                  Metode Pengiriman
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {shippingLogos.map((logo) => (
                    <div
                      key={logo.alt}
                      className="flex items-center justify-center rounded-xl bg-white/70 dark:bg-white/5 border border-neutral-200/70 dark:border-zinc-700 p-3 shadow-sm hover:shadow-md transition-all"
                      title={logo.alt}
                    >
                      <img
                        src={logo.src}
                        alt={logo.alt}
                        width={80}
                        height={28}
                        className="h-7 w-auto object-contain grayscale opacity-80 hover:opacity-100 transition"
                        onError={(e) => {
                          e.currentTarget.style.filter = "grayscale(0)";
                          e.currentTarget.style.opacity = "0.6";
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* kanan */}
          <div className="md:col-span-4">
            <section aria-labelledby="terms-head">
              <h3 id="terms-head" className="text-lg font-semibold mb-6">
                Terms & Conditions
              </h3>
              <ul className="space-y-3">
                {policyLinks.map((p) => (
                  <li key={p.label}>
                    <Link
                      href={p.href}
                      className="group inline-flex items-center gap-2 text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white"
                    >
                      <span className="underline decoration-neutral-400/60 underline-offset-4 group-hover:decoration-neutral-800 dark:group-hover:decoration-white">
                        {p.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      {/* bottom */}
      <div className="border-t border-neutral-200/70 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 py-6 flex flex-col gap-3 sm:flex-row items-center justify-between text-sm text-neutral-600 dark:text-zinc-400">
          <p>
            © {new Date().getFullYear()} BLACKBOXINC Shop. All rights reserved.
          </p>
          <p className="opacity-80">
            Aman & Terpercaya · Dukungan 24/7 · Pengiriman cepat
          </p>
        </div>
      </div>

      {/* back to top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Kembali ke atas"
          className="group fixed bottom-5 right-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg ring-1 ring-black/10 hover:shadow-xl transition dark:bg-white dark:text-black"
        >
          <ChevronUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
        </button>
      )}
    </footer>
  );
}
