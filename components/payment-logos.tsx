import Image from "next/image";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Strip logo metode pembayaran yang didukung "Pembayaran Online".
 * Memakai aset logo resmi di /public, ditampilkan dalam kartu berukuran
 * SERAGAM (tinggi & lebar sama) dengan object-contain agar tidak gepeng.
 */

type PaymentLogo = {
  key: string;
  src: string;
  alt: string;
};

const PAYMENT_LOGOS: PaymentLogo[] = [
  { key: "qris", src: "/icon-qris.png", alt: "QRIS" },
  { key: "gopay", src: "/icon-gopay.png", alt: "GoPay" },
  { key: "ovo", src: "/icon-ovo.png", alt: "OVO" },
  { key: "dana", src: "/icon-dana.png", alt: "DANA" },
  { key: "shopeepay", src: "/icon-shopepay.png", alt: "ShopeePay" },
];

export function PaymentLogos({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {PAYMENT_LOGOS.map(({ key, src, alt }) => (
        <span
          key={key}
          className="flex h-10 w-[78px] items-center justify-center rounded-lg border border-gray-200 bg-white px-2.5 py-2 shadow-sm"
        >
          <span className="relative h-full w-full">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="78px"
              className="object-contain"
            />
          </span>
        </span>
      ))}
      {/* Virtual Account — diwakili ikon bank */}
      <span className="flex h-10 w-[78px] flex-col items-center justify-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1 py-1 shadow-sm">
        <Landmark className="h-3.5 w-3.5 text-slate-600" />
        <span className="text-center text-[7px] font-semibold leading-[1.1] text-slate-600">
          Virtual Account
        </span>
      </span>
    </div>
  );
}
