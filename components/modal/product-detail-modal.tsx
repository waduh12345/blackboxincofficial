// components/form-modal/shop/product-detail-modal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  X,
  Star,
  Heart,
  Truck,
  ShieldCheck,
  ArrowRight,
  Share2,
  Plus,
  Minus,
} from "lucide-react";
import Swal from "sweetalert2"; // Asumsi Swal sudah di-import
import { Button } from "../ui/button"; // Asumsi Button sudah B&W

/** ====== Types (samakan dengan ListingProduct) ====== */
type Product = {
  id: string;
  name: string;
  price: number;
  was?: number;
  image?: string;
  images?: string[];
  href: string;
  rating?: number;
  reviews?: number;
  stock?: number;
  sku?: string;
  sizes?: string[];
  desc?: string;
  colors?: { name: string; hex: string }[];
};

interface ProductDetailModalProps {
  active: Product | null;
  onClose: () => void;
}

/** ====== Utils & Const (B&W Styling) ====== */
const IMG_FALLBACK =
  "https://via.placeholder.com/400x400/000000/FFFFFF?text=BLACKBOXINC";

const DEF_COLORS = [
  { name: "Navy", hex: "#1f2937" },
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#F9FAFB" },
  { name: "Grey", hex: "#6b7280" },
];

const DEF_SIZES = ["S", "M", "L", "XL", "XXL"] as const;

const CURRENCY = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });

const etaRange = () => {
  const a = new Date();
  const b = new Date();
  a.setDate(a.getDate() + 2);
  b.setDate(b.getDate() + 5);
  return `${formatDate(a)} – ${formatDate(b)}`;
};

// B&W Star Rating
function StarRating({ value = 0 }: { value?: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-0.5 text-black">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < full || (i === full && half);
        return (
          <Star
            key={i}
            className={`h-4 w-4 ${
              // Bintang diisi hitam, outline abu-abu
              filled ? "fill-black text-black" : "fill-transparent text-gray-300"
            }`}
          />
        );
      })}
    </div>
  );
}
// --- End Utils ---

/** ====== Component ====== */
export default function ProductDetailModal({
  active,
  onClose,
}: ProductDetailModalProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // lock scroll + init defaults when open (logic remains the same)
  useEffect(() => {
    if (active) {
      document.documentElement.style.overflow = "hidden";
      setActiveImg(0);
      setColor(active.colors?.[0]?.name ?? DEF_COLORS[0].name);
      setSize(active.sizes?.[0] ?? DEF_SIZES[0]);
      setQty(1);
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [active]);

  // esc + focus trap (logic remains the same)
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const activeEl = document.activeElement as HTMLElement | null;
        if (e.shiftKey && activeEl === first) {
          last.focus();
          e.preventDefault();
        } else if (!e.shiftKey && activeEl === last) {
          first.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);

  const total = useMemo(() => (active ? active.price * qty : 0), [active, qty]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[70] overflow-y-auto" // Added overflow-y-auto
      role="dialog"
      aria-modal="true"
      aria-label={`Detail ${active.name}`}
    >
      {/* Backdrop B&W */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel Wrapper */}
      <div className="relative mx-auto my-6 max-w-5xl p-4 md:p-0"> {/* Adjusted padding */}
        <div
          ref={panelRef}
          // Panel B&W Styling
          className="animate-[fadeIn_180ms_ease-out] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl"
        >
          <div className="grid gap-0 md:grid-cols-2">
            
            {/* Left: Gallery */}
            <div className="relative p-0 md:p-4 bg-gray-50">
              <div className="overflow-hidden">
                <img
                  src={
                    (active.images ?? [active.image ?? IMG_FALLBACK])[
                      activeImg
                    ] ?? IMG_FALLBACK
                  }
                  alt={`${active.name} - image ${activeImg + 1}`}
                  className="h-96 w-full object-cover md:h-[540px] grayscale-[10%]" // Grayscale image
                />
              </div>
              <div className="mt-3 flex gap-2 p-3 md:p-0">
                {(active.images ?? [active.image ?? IMG_FALLBACK]).map(
                  (src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`overflow-hidden rounded-lg ring-2 transition ${
                        // Thumbnails B&W Styling
                        i === activeImg
                          ? "ring-black ring-2"
                          : "ring-gray-300 hover:ring-black/50"
                      }`}
                      aria-label={`Select image ${i + 1}`}
                    >
                      <img
                        src={src}
                        alt={`thumb ${i + 1}`}
                        className="h-16 w-16 object-cover grayscale-[10%]"
                      />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Right: Content */}
            <div className="relative p-6 md:p-8">
              {/* Close Button B&W */}
              <button
                ref={closeBtnRef}
                onClick={onClose}
                aria-label="Tutup"
                className="absolute right-4 top-4 rounded-full p-2 text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-start justify-between gap-3 pr-8">
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-black uppercase">
                    {active.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <StarRating value={active.rating ?? 0} />
                    <span className="text-sm text-gray-600">
                      {(active.rating ?? 0).toFixed(1)} • {active.reviews ?? 0}{" "}
                      reviews
                    </span>
                  </div>
                  {/* SKU & Stock Info B&W */}
                  <div className="mt-1 text-xs text-gray-500">
                    SKU:{" "}
                    <span className="font-mono">
                      {active.sku ?? `BBX-${active.id}`}
                    </span>{" "}
                    • Stock:{" "}
                    <span
                      className={
                        active.stock && active.stock > 0
                          ? "text-black font-semibold"
                          : "text-red-600 font-semibold" // Tetap merah untuk out of stock
                      }
                    >
                      {active.stock && active.stock > 0
                        ? `${active.stock} available`
                        : "Sold Out"}
                    </span>
                  </div>
                </div>
                {/* Wishlist Button B&W */}
                <button
                  className="rounded-full p-2 text-black hover:bg-gray-50 transition-colors"
                  aria-label="Tambah ke wishlist"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("wishlist:add", { detail: active })
                    )
                  }
                >
                  <Heart className="h-5 w-5 fill-transparent hover:fill-black" />
                </button>
              </div>

              {/* Price */}
              <div className="mt-3 flex items-end gap-2 border-b border-gray-100 pb-3">
                <span className="text-3xl font-extrabold text-black">
                  {CURRENCY(active.price)}
                </span>
                {active.was && (
                  <span className="text-base text-gray-500 line-through">
                    {CURRENCY(active.was)}
                  </span>
                )}
                {active.was && active.was > active.price && (
                  // Discount Tag B&W
                  <span className="inline-flex items-center rounded-lg bg-black px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                    -
                    {Math.max(
                      0,
                      Math.round(
                        ((active.was - active.price) / active.was) * 100
                      )
                    )}
                    %
                  </span>
                )}
              </div>

              {active.desc && (
                <p className="mt-3 text-sm text-gray-700">{active.desc}</p>
              )}
              
              {/* Options (size) */}
              <div className="mt-5 grid grid-cols-1">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-black">
                    Size
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(active.sizes ?? Array.from(DEF_SIZES)).map((s) => {
                      const selected = size === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setSize(s)}
                          // Size Option B&W Styling
                          className={`rounded-lg px-4 py-2 text-sm font-semibold ring-1 transition ${
                            selected
                              ? "bg-black text-white ring-black"
                              : "bg-white text-gray-700 ring-gray-300 hover:ring-black/50"
                          }`}
                          aria-pressed={selected}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Qty + Total */}
              <div className="mt-5 flex flex-wrap items-center gap-4">
                {/* Qty Controls B&W */}
                <div className="inline-flex items-center rounded-lg border border-gray-300">
                  <button
                    className="p-2 hover:bg-gray-50 rounded-l-lg text-black"
                    aria-label="Kurangi"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    className="w-12 border-x border-gray-300 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-black font-semibold"
                    value={qty}
                    min={1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQty(Number.isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    aria-label="Jumlah"
                  />
                  <button
                    className="p-2 hover:bg-gray-50 rounded-r-lg text-black"
                    aria-label="Tambah"
                    onClick={() => setQty((q) => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="text-sm text-gray-700">
                  Total:{" "}
                  <span className="font-extrabold text-black">
                    {CURRENCY(total)}
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="mt-6 grid grid-cols-3 items-center gap-3"> {/* Changed gap to 3 */}
                {/* Add to Cart Button B&W */}
                <button
                  className="col-span-2 inline-flex items-center justify-center rounded-lg bg-black px-4 py-3 text-base font-bold text-white shadow-xl hover:bg-gray-800 transition-colors uppercase tracking-wider disabled:bg-gray-400"
                  onClick={async () => {
                    if (!size) { // Removed color check since DEF_COLORS are B&W/neutral
                      await Swal.fire({
                        icon: "warning",
                        title: "Pilih varian dulu",
                        text: "Pilih ukuran sebelum menambahkan ke keranjang.",
                        confirmButtonText: "Oke",
                        confirmButtonColor: "#000000",
                      });
                      return;
                    }

                    window.dispatchEvent(
                      new CustomEvent("cart:add", {
                        detail: { ...active, color, size, qty },
                      })
                    );

                    const Toast = Swal.mixin({
                      toast: true,
                      position: "top-end",
                      showConfirmButton: false,
                      timer: 1800,
                      timerProgressBar: true,
                    });
                    await Toast.fire({
                      icon: "success",
                      title: "Ditambahkan ke keranjang",
                    });
                    onClose(); // Close modal after successful add
                  }}
                  disabled={!!active.stock && active.stock <= 0}
                >
                  Add to Cart
                </button>
                
                {/* Share Button B&W */}
                <Button
                  variant="outline"
                  className="col-span-1 border border-gray-300 text-black hover:bg-gray-50"
                  onClick={async () => {
                    const shareText = `${active.name} — ${CURRENCY(active.price)}`;
                    const url = `${location.origin}${active.href}`;

                    try {
                      if (navigator.share) {
                        await navigator.share({
                          title: active.name,
                          text: shareText,
                          url,
                        });
                        await Swal.fire({
                          toast: true,
                          position: "top-end",
                          icon: "success",
                          title: "Link Shared",
                          showConfirmButton: false,
                          timer: 1600,
                          timerProgressBar: true,
                        });
                        return;
                      }

                      await navigator.clipboard.writeText(
                        `${shareText} ${url}`
                      );
                      await Swal.fire({
                        icon: "success",
                        title: "Link Copied",
                        text: "The product link is now in your clipboard.",
                        confirmButtonText: "Oke",
                        confirmButtonColor: "#000000",
                      });
                    } catch (err) {
                       // Fallback error copy
                       await navigator.clipboard.writeText(`${shareText} ${url}`);
                       await Swal.fire({
                            icon: "success",
                            title: "Link Copied",
                            text: "The product link is now in your clipboard.",
                            confirmButtonText: "Oke",
                            confirmButtonColor: "#000000",
                       });
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" /> Share
                </Button>
              </div>

              {/* Shipping & Guarantee */}
              <div className="mt-6 grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">
                {/* Shipping B&W */}
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <Truck className="h-4 w-4 text-black" />
                  ETA: {etaRange()}
                </div>
                {/* Guarantee B&W */}
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <ShieldCheck className="h-4 w-4 text-black" />
                  7-day exchange guarantee
                </div>
              </div>

              {/* Details / Specs */}
              <div className="mt-6 rounded-lg border border-gray-300">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-black uppercase tracking-wider">
                    Details & Specifications
                    <span className="text-gray-500 group-open:rotate-180 transition">
                      ⌄
                    </span>
                  </summary>
                  <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-700">
                    <ul className="ms-4 list-disc space-y-1">
                      <li>Material: Premium heavy cotton blend</li>
                      <li>Care: Cold wash, do not use bleach</li>
                      <li>Origin: Indonesia</li>
                    </ul>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 sm:grid-cols-3">
                      <div>
                        <span className="text-gray-500">SKU:</span>{" "}
                        {active.sku ?? `BBX-${active.id}`}
                      </div>
                      <div>
                        <span className="text-gray-500">Weight:</span> ~350g
                      </div>
                      <div>
                        <span className="text-gray-500">Category:</span> Best
                        Seller
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* helper text B&W */}
        <div className="mt-3 text-center text-sm text-white/90">
          Press <kbd className="rounded bg-black/50 px-1 py-0.5 text-white">Esc</kbd> or click outside to close
        </div>
      </div>
    </div>
  );
}