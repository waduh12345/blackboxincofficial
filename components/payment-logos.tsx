import Image from "next/image";
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
      <span className="flex h-10 w-[78px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[11px] font-semibold text-gray-500">
        +lainnya
      </span>
    </div>
  );
}
