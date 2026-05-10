"use client";

import { X } from "lucide-react";
import clsx from "clsx";

interface OutOfStockOverlayProps {
  show: boolean;
  label?: string;
  className?: string;
}

/**
 * Overlay abu-abu gelap dengan ikon X di tengah untuk menandai produk
 * yang stoknya habis. Letakkan sebagai sibling terakhir di dalam container
 * gambar produk yang ber-`position: relative`.
 */
export default function OutOfStockOverlay({
  show,
  label = "Stok Habis",
  className,
}: OutOfStockOverlayProps) {
  if (!show) return null;

  return (
    <div
      aria-label={label}
      className={clsx(
        "absolute inset-0 z-20 flex flex-col items-center justify-center",
        "bg-gray-900/65 backdrop-blur-[1px] text-white pointer-events-none",
        "select-none",
        className
      )}
    >
      <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full border-2 border-white/90 bg-black/40 shadow-lg">
        <X className="h-7 w-7 md:h-9 md:w-9 stroke-[2.5]" />
      </div>
      <span className="mt-2 md:mt-3 text-xs md:text-sm font-extrabold uppercase tracking-widest drop-shadow-md">
        {label}
      </span>
    </div>
  );
}
