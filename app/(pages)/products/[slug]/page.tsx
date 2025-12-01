"use client";

import { useMemo, useState, useEffect } from "react";
import { notFound } from "next/navigation";
import {
  useGetProductListQuery,
  useGetProductVariantBySlugQuery,
} from "@/services/product.service";
import type {
  Product as ApiProduct,
  ProductMedia,
} from "@/types/admin/product";
import { ShoppingCart } from "lucide-react";
import Swal from "sweetalert2";
import clsx from "clsx";
import useCart from "@/hooks/use-cart"; // Hapus CartItem jika tidak dipakai langsung

// SALIN helper fungsi toNumber dari productpage.tsx
const toNumber = (val: number | string): number => {
  if (typeof val === "number") return val;
  const parsed = parseFloat(val);
  return Number.isFinite(parsed) ? parsed : 0;
};
// END SALIN

// Fallback untuk gambar jika tidak ada
const FALLBACK_IMG =
  "https://i.pinimg.com/1200x/dc/28/77/dc2877f08ba923ba34c8fa70bae94128.jpg";

// Utility untuk format mata uang
const CURRENCY = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

// Tipe untuk varian produk
export interface ProductVariant {
  id: number;
  name: string | number;
  price: number | string;
  stock: number | string;
  sku?: string | null;
}

// Type guard untuk varian
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

// Update Interface ProductDetail dengan markup_price
interface ProductDetail extends ApiProduct {
  weight: number;
  length: number;
  width: number;
  height: number;
  diameter: number;
  sales: number;
  rating: number | string;
  total_reviews: number;
  media?: ProductMedia[] | null;
  product_variant_id?: number | null;
}

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}

function ProductDetailClient({ slug }: { slug: string }) {
  const { addItem, cartItems } = useCart();
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [qty, setQty] = useState(1);

  // 1. Ambil data produk
  const { data, isLoading, isError, isFetching } = useGetProductListQuery({
    page: 1,
    paginate: 50,
  });

  // Ambil data Varian
  const { data: detailProductVariant } = useGetProductVariantBySlugQuery(slug, {
    skip: !slug,
  });

  // 2. Filter data berdasarkan slug
  const product = useMemo<ProductDetail | undefined>(() => {
    const list: ApiProduct[] = data?.data ?? [];
    const foundProduct = list.find(
      (p) => (p as { slug: string }).slug === slug
    );
    return foundProduct as ProductDetail | undefined;
  }, [data, slug]);

  // Proses data varian
  const variants = useMemo<ProductVariant[]>(() => {
    const maybe = (detailProductVariant as unknown as { data?: unknown })?.data;
    return isVariantArray(maybe) ? maybe : [];
  }, [detailProductVariant]);

  // Sinkronisasi Varian
  useEffect(() => {
    if (product && variants.length === 0) {
      setSelectedVariant({
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        sku: product.sku ?? null,
      } as ProductVariant);
    } else if (variants.length > 0) {
      setSelectedVariant(null);
    }
    setQty(1);
  }, [product, variants.length]);

  const isInitialLoading = isLoading && isFetching;

  if (!isInitialLoading && !product) {
    notFound();
  }

  if (isInitialLoading) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-500">
        {`Memuat detail produk untuk "${slug}"...`}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-96 items-center justify-center text-red-600">
        Gagal memuat detail produk.
      </div>
    );
  }

  if (!product) {
    return null;
  }

  // --- LOGIKA HARGA & DISKON ---
  const currentPrice = toNumber(selectedVariant?.price ?? product.price ?? 0);
  // Ambil markup price (harga asli sebelum diskon)
  const currentMarkupPrice = toNumber(product.markup_price ?? 0);

  const currentStock = toNumber(selectedVariant?.stock ?? product.stock ?? 0);
  const currentSku = selectedVariant?.sku ?? product.sku ?? "N/A";

  const defaultMainImage =
    (product.image as string) ||
    product.media?.[0]?.original_url ||
    FALLBACK_IMG;

  const currentMainImage = activeImageUrl || defaultMainImage;

  const handleThumbnailClick = (url: string) => {
    setActiveImageUrl(url);
  };

  const totalDisplayPrice = currentPrice * qty;

  // --- LOGIKA CART ---
  const addToCart = () => {
    const variantId =
      selectedVariant?.id ?? product.product_variant_id ?? product.id;

    if (variants.length > 0 && !selectedVariant) {
      Swal.fire({
        icon: "warning",
        title: "Pilih Varian",
        text: "Anda harus memilih varian produk sebelum menambahkan ke keranjang.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (currentStock <= 0) {
      Swal.fire({
        icon: "error",
        title: "Stok Habis",
        text: "Produk (atau varian yang dipilih) saat ini stoknya habis.",
        confirmButtonColor: "#d33",
      });
      return;
    }

    const existingItem = cartItems.find(
      (item) => item.id === product.id && item.product_variant_id === variantId
    );
    const potentialNewQty = (existingItem?.quantity ?? 0) + qty;

    if (potentialNewQty > currentStock) {
      Swal.fire({
        icon: "warning",
        title: "Stok Terbatas",
        text: `Anda hanya bisa memiliki total ${currentStock} unit produk ini di keranjang.`,
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const productToAdd: ApiProduct = {
      ...product,
      price: currentPrice,
      product_variant_id: variantId,
    };

    try {
      for (let i = 0; i < qty; i++) {
        addItem(productToAdd, variantId);
      }

      Swal.fire({
        icon: "success",
        title: "Ditambahkan ke Keranjang!",
        text: `${qty}x ${product.name} berhasil ditambahkan.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error("Gagal menambahkan ke keranjang:", e);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Terjadi kesalahan saat menyimpan produk ke keranjang.",
        confirmButtonColor: "#d33",
      });
    }
  };

  const displayRating =
    typeof product.rating === "number"
      ? product.rating.toFixed(1)
      : (Number(product.rating) || 0).toFixed(1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 md:py-20 bg-white">
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
        {/* Gallery Produk */}
        <div className="lg:sticky lg:top-8">
          <div className="aspect-square w-full overflow-hidden rounded-lg">
            <img
              src={currentMainImage}
              alt={product.name}
              className="h-full w-full object-cover object-center"
            />
          </div>
          <div className="mt-6 grid grid-cols-4 gap-4">
            {product.image && (
              <div
                key="main-thumb"
                onClick={() => handleThumbnailClick(product.image as string)}
                className={`aspect-square overflow-hidden rounded-lg ring-2 cursor-pointer ${
                  currentMainImage === (product.image as string)
                    ? "ring-black"
                    : "ring-gray-200 hover:ring-black/50"
                }`}
              >
                <img
                  src={product.image as string}
                  alt={`${product.name} gambar utama`}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
            {product.media?.map((media, index) => {
              const imageUrl = media.original_url as string;
              return (
                <div
                  key={media.id || index}
                  onClick={() => handleThumbnailClick(imageUrl)}
                  className={`aspect-square overflow-hidden rounded-lg ring-2 cursor-pointer ${
                    currentMainImage === imageUrl
                      ? "ring-black"
                      : "ring-gray-200 hover:ring-black/50"
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`${product.name} gambar ${index + 1}`}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Produk */}
        <div className="mt-10 lg:mt-0">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl uppercase">
            {product.name}
          </h1>

          {/* --- BAGIAN TAMPILAN HARGA DENGAN DISKON --- */}
          <div className="mt-4">
            {currentMarkupPrice > currentPrice ? (
              <div className="flex flex-col">
                <div className="flex items-baseline gap-3">
                  {/* Harga Jual (Merah & Besar) */}
                  <span className="text-3xl font-extrabold text-red-600">
                    {CURRENCY(currentPrice)}
                  </span>
                  {/* Harga Coret (Abu-abu) */}
                  <span className="text-xl text-gray-400 line-through">
                    {CURRENCY(currentMarkupPrice)}
                  </span>
                </div>
                {/* Badge Hemat */}
                <div className="mt-1">
                  <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                    Save{" "}
                    {Math.round(
                      ((currentMarkupPrice - currentPrice) /
                        currentMarkupPrice) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            ) : (
              /* Harga Normal */
              <p className="text-3xl font-bold text-black">
                {CURRENCY(currentPrice)}
              </p>
            )}
          </div>
          {/* --- END TAMPILAN HARGA --- */}

          <div className="mt-2 text-xs text-gray-500">
            SKU: <span className="font-mono">{currentSku}</span> • Stock:{" "}
            <span
              className={
                currentStock > 0
                  ? "text-black font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              {currentStock > 0 ? `${currentStock} available` : "Sold Out"}
            </span>
          </div>

          {/* Bagian Pemilihan Varian (NON-MODAL) */}
          {variants.length > 0 && (
            <div className="mt-5 grid grid-cols-1">
              <div>
                <div className="text-sm font-bold uppercase tracking-wider text-gray-900">
                  Pilih Varian
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    const vStock = toNumber(v.stock);
                    const isDisabled = vStock <= 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        disabled={isDisabled}
                        className={clsx(
                          "rounded-lg px-4 py-2 text-sm font-semibold ring-1 transition",
                          isDisabled &&
                            "opacity-50 cursor-not-allowed line-through",
                          isSelected
                            ? "bg-black text-white ring-black"
                            : "bg-white text-gray-700 ring-gray-300 hover:ring-black/50"
                        )}
                        aria-pressed={isSelected}
                      >
                        {String(v.name)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* QTY Picker */}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="inline-flex items-center rounded-lg border border-gray-300">
              <button
                className="p-2 hover:bg-gray-50 rounded-l-lg text-black"
                aria-label="Kurangi"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={currentStock <= 0 || qty <= 1}
              >
                -
              </button>
              <input
                type="number"
                className="w-12 border-x border-gray-300 text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-black font-semibold"
                value={qty}
                min={1}
                max={currentStock > 0 ? currentStock : 100}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  const max = currentStock > 0 ? currentStock : Infinity;
                  setQty(
                    Number.isNaN(val) ? 1 : Math.max(1, Math.min(val, max))
                  );
                }}
                aria-label="Jumlah"
                disabled={currentStock <= 0}
              />
              <button
                className="p-2 hover:bg-gray-50 rounded-r-lg text-black"
                aria-label="Tambah"
                onClick={() =>
                  setQty((q) =>
                    Math.min(q + 1, currentStock > 0 ? currentStock : Infinity)
                  )
                }
                disabled={currentStock <= 0 || qty >= currentStock}
              >
                +
              </button>
            </div>

            <div className="text-sm text-gray-700">
              Total Harga:{" "}
              <span className="font-extrabold text-black">
                {CURRENCY(totalDisplayPrice)}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Deskripsi</h3>
            <div
              className="space-y-6 text-base text-gray-700"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">Detail Produk</h3>
            <dl className="mt-4 space-y-4 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <dt className="font-medium text-gray-900">Kategori</dt>
                <dd>{product.category_name}</dd>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <dt className="font-medium text-gray-900">Merek</dt>
                <dd>{product.merk_name}</dd>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <dt className="font-medium text-gray-900">Berat</dt>
                <dd>{product.weight} kg</dd>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <dt className="font-medium text-gray-900">Penjualan</dt>
                <dd>{product.sales || 0}x terjual</dd>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <dt className="font-medium text-gray-900">Rating</dt>
                <dd>
                  {displayRating} ({product.total_reviews} ulasan)
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-10">
            <button
              onClick={addToCart}
              type="button"
              disabled={
                currentStock <= 0 || (variants.length > 0 && !selectedVariant)
              }
              className="flex w-full items-center justify-center rounded-md border border-transparent bg-black px-8 py-3 text-base font-medium text-white hover:bg-gray-800 disabled:bg-gray-400"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {currentStock > 0
                ? variants.length > 0 && !selectedVariant
                  ? "Pilih Varian Dulu"
                  : "Tambah ke Keranjang"
                : "Stok Habis"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}