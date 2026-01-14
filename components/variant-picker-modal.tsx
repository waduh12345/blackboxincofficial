"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { Product } from "@/types/admin/product";
import { useGetProductVariantBySlugQuery } from "@/services/product.service";
import { useGetProductVariantSizesQuery } from "@/services/admin/product-variant-size.service";
import useCart from "@/hooks/use-cart";
import Swal from "sweetalert2";
import clsx from "clsx";
import { ProductVariant } from "@/types/admin/product-variant";

// --- TYPES ---
type ProductVariantSize = {
  id: number;
  name: string | number;
  price: number | string;
  stock: number | string;
  sku?: string | null;
};

// --- HELPERS ---

const isVariantArray = (v: unknown): v is ProductVariant[] =>
  Array.isArray(v) &&
  v.every(
    (o) =>
      !!o &&
      typeof o === "object" &&
      "id" in o &&
      "name" in o &&
      "price" in o &&
      "stock" in o
  );

const isSizeArray = (v: unknown): v is ProductVariantSize[] =>
  Array.isArray(v) &&
  v.every(
    (o) =>
      !!o &&
      typeof o === "object" &&
      "id" in o &&
      "name" in o &&
      "price" in o &&
      "stock" in o
  );

const toNumber = (val: number | string | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const IMG_FALLBACK =
  "https://via.placeholder.com/400x400/000000/FFFFFF?text=BLACKBOX.INC";

function getImageUrl(p?: Product): string {
  if (!p) return IMG_FALLBACK;
  if (typeof p.image === "string" && p.image) return p.image;
  const media = (p as unknown as { media?: { original_url: string }[] })?.media;
  if (Array.isArray(media) && media[0]?.original_url)
    return media[0].original_url;
  return IMG_FALLBACK;
}

// --- COMPONENT ---

export default function VariantPickerModal({
  open,
  product,
  onClose,
  onAdded,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onAdded?: () => void;
}) {
  const { addItem } = useCart();

  // State untuk gambar aktif (agar bisa berubah saat varian dipilih)
  const [activeImage, setActiveImage] = useState<string>(IMG_FALLBACK);

  // 1. Fetch Variants
  const slug = product?.slug ?? "";
  const { data: variantResp, isLoading: isLoadingVariants } =
    useGetProductVariantBySlugQuery(slug, {
      skip: !open || !slug,
    });

  const variants: ProductVariant[] = useMemo(() => {
    const maybe = (variantResp as unknown as { data?: unknown })?.data;
    return isVariantArray(maybe) ? maybe : [];
  }, [variantResp]);

  // State Selection
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [selectedSize, setSelectedSize] = useState<ProductVariantSize | null>(
    null
  );
  const [qty, setQty] = useState<number>(1);

  // 2. Fetch Sizes (Triggered when variant is selected)
  const { data: sizeResp, isFetching: isFetchingSizes } =
    useGetProductVariantSizesQuery(
      { variantId: selectedVariant?.id ?? 0, page: 1, paginate: 100 },
      { skip: !selectedVariant || !open }
    );

  const sizes: ProductVariantSize[] = useMemo(() => {
    const maybe = (sizeResp as unknown as { data?: unknown })?.data;
    return isSizeArray(maybe) ? maybe : [];
  }, [sizeResp]);

  // --- EFFECTS ---

  // Effect: Set gambar awal saat modal dibuka atau produk berubah
  useEffect(() => {
    if (open && product) {
      setActiveImage(getImageUrl(product));
    }
  }, [open, product]);

  // Effect: Update gambar jika varian dipilih dan memiliki gambar
  useEffect(() => {
    if (selectedVariant?.image) {
      setActiveImage(selectedVariant.image);
    }
    // Opsional: Jika ingin reset ke gambar produk saat deselect, tambahkan else logic di sini
  }, [selectedVariant]);

  // Auto-add jika produk tidak memiliki varian sama sekali (Simple Product)
  useEffect(() => {
    if (!open || !product) return;
    if (!isLoadingVariants && variants.length === 0) {
      const fallbackPrice = toNumber(product.price);
      addItem(
        { ...product, price: fallbackPrice },
        product.product_variant_id ?? 0
      );
      onClose();
      onAdded?.();
    }
  }, [
    open,
    isLoadingVariants,
    variants.length,
    product,
    addItem,
    onClose,
    onAdded,
  ]);

  // Reset state saat modal ditutup
  useEffect(() => {
    if (!open) {
      setSelectedVariant(null);
      setSelectedSize(null);
      setQty(1);
    }
  }, [open]);

  // Reset Size saat Variant berubah
  useEffect(() => {
    setSelectedSize(null);
  }, [selectedVariant]);

  // --- CALCULATION LOGIC ---

  if (!open || !product) return null;
  // Jika varian kosong, null (karena sudah di-handle auto-add)
  if (variants.length === 0) return null;

  // 1. Hitung Harga Satuan (Aditif)
  // Harga = Harga Produk + Harga Varian + Harga Size
  const basePrice = toNumber(product.price);
  const variantPrice = toNumber(selectedVariant?.price);
  const sizePrice = toNumber(selectedSize?.price);

  const unitPrice = basePrice + variantPrice + sizePrice;
  const totalPrice = unitPrice * qty;

  // 2. Tentukan Stok Hierarkis (Size > Variant > Product)
  const curStock = toNumber(
    selectedSize?.stock ?? selectedVariant?.stock ?? product.stock
  );

  // --- HANDLERS ---

  const handleAdd = () => {
    if (!selectedVariant) return;

    // Validasi Size jika ada sizes tersedia tapi belum dipilih
    if (sizes.length > 0 && !selectedSize) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Ukuran",
        text: "Silakan pilih ukuran terlebih dahulu.",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    const vId = selectedVariant.id;
    const sId = selectedSize?.id ?? null;

    // Construct item dengan data lengkap untuk cart
    const productToAdd = {
      ...product,
      price: unitPrice, // Harga final per unit
      product_variant_id: vId,
      product_variant_size_id: sId, // Tambahkan size ID
    };

    // Panggil addItem
    for (let i = 0; i < qty; i++) {
      addItem(productToAdd, vId);
    }

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Produk telah ditambahkan ke keranjang.",
      showConfirmButton: false,
      timer: 1500,
      toast: true,
      position: "top-end",
      background: "#ffffff",
      color: "#000000",
      iconColor: "#000000",
      customClass: {
        popup: "border border-gray-200 shadow-xl",
      },
    });

    onAdded?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92%] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="text-base font-bold uppercase tracking-wider text-black">
            Pilih Opsi Produk
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-black hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-[140px_1fr]">
          {/* Product Image */}
          <div className="rounded-lg border bg-gray-50 p-1 self-start">
            <Image
              src={activeImage} // Menggunakan activeImage state
              alt={product.name}
              width={140}
              height={140}
              className="h-36 w-full rounded-md object-cover"
              unoptimized
            />
          </div>

          <div>
            <div className="mb-3">
              <div className="text-sm font-semibold text-black">
                {product.name}
              </div>
              <div className="text-xs text-gray-600">
                {product.category_name}
              </div>
            </div>

            {/* --- VARIAN --- */}
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-black">
                Varian
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((v) => {
                  const isActive = selectedVariant?.id === v.id;
                  const disabled = false;

                  return (
                    <button
                      key={v.id}
                      disabled={disabled}
                      onClick={() => setSelectedVariant(v)}
                      // Update styling untuk mengakomodasi gambar dan flex layout
                      className={clsx(
                        "flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-3 text-sm font-semibold ring-1 transition",
                        disabled &&
                          "cursor-not-allowed opacity-50 line-through ring-gray-200",
                        isActive
                          ? "bg-black text-white ring-black"
                          : "bg-white text-gray-700 ring-gray-300 hover:ring-black/60"
                      )}
                    >
                      {/* Thumbnail Varian */}
                      {v.image && (
                        <div className="h-6 w-6 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                          <img
                            src={v.image}
                            alt={String(v.name)}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <span>{String(v.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- UKURAN (Muncul jika varian dipilih) --- */}
            {selectedVariant &&
              (isFetchingSizes ? (
                <div className="mb-4 text-xs text-gray-400 animate-pulse">
                  Memuat ukuran...
                </div>
              ) : (
                sizes.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-black">
                      Ukuran
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sizes.map((s) => {
                        const isActive = selectedSize?.id === s.id;
                        const sStock = toNumber(s.stock);
                        const disabled = sStock <= 0;

                        return (
                          <button
                            key={s.id}
                            disabled={disabled}
                            onClick={() => setSelectedSize(s)}
                            className={clsx(
                              "rounded-md px-3 py-1.5 text-sm font-semibold ring-1 transition",
                              disabled &&
                                "cursor-not-allowed opacity-50 bg-gray-100 ring-gray-200 text-gray-400 decoration-slice",
                              isActive
                                ? "bg-black text-white ring-black"
                                : "bg-white text-gray-700 ring-gray-300 hover:ring-black/60"
                            )}
                          >
                            {String(s.name)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}

            {/* --- QTY & TOTAL --- */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center rounded-lg border border-gray-300">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={!selectedVariant || curStock <= 0 || qty <= 1}
                  className="rounded-l-lg p-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  className="w-12 border-x border-gray-300 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={qty}
                  min={1}
                  max={curStock > 0 ? curStock : 1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    const max = curStock > 0 ? curStock : 1;
                    setQty(Number.isNaN(v) ? 1 : Math.max(1, Math.min(v, max)));
                  }}
                  disabled={!selectedVariant || curStock <= 0}
                />
                <button
                  onClick={() =>
                    setQty((q) => Math.min(q + 1, curStock > 0 ? curStock : 1))
                  }
                  disabled={
                    !selectedVariant || curStock <= 0 || qty >= curStock
                  }
                  className="rounded-r-lg p-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="text-sm">
                <span className="text-gray-600">Total: </span>
                <span className="font-extrabold text-black">
                  Rp {totalPrice.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* --- ADD BUTTON --- */}
            <button
              onClick={handleAdd}
              disabled={
                !selectedVariant ||
                curStock <= 0 ||
                (sizes.length > 0 && !selectedSize)
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-white transition hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="h-5 w-5" />
              {curStock <= 0
                ? "Stok Habis"
                : sizes.length > 0 && !selectedSize
                ? "Pilih Ukuran"
                : "Tambah ke Keranjang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}