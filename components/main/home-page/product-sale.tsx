"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { useGetProductListQuery } from "@/services/product.service";
import { Product } from "@/types/admin/product";

const FALLBACK_IMG = "https://placehold.co/800x1066/efefef/444?text=Product";

type SaleItem = {
  id: string;
  name: string;
  price: number; // Harga jual saat ini
  was?: number; // Harga coret / Markup price
  href: string;
  image?: string;
  desc?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
  sku?: string;
};

const CURRENCY = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

/* ================= Helpers mapping ================= */
function getProductImage(p: Product): string | undefined {
  const maybe = p as unknown as {
    image?: string | null;
    images?: string[] | null;
    media?: { original_url?: string }[] | null;
    thumbnail?: string | null;
  };
  return (
    maybe?.image ??
    maybe?.thumbnail ??
    (maybe?.images && maybe.images[0]) ??
    (maybe?.media && maybe.media[0]?.original_url) ??
    undefined
  );
}

function getProductSlug(p: Product): string {
  const maybe = p as unknown as { slug?: string; id?: number | string };
  return maybe?.slug ?? String(maybe?.id ?? "");
}

function getProductName(p: Product): string {
  const maybe = p as unknown as { name?: string; title?: string };
  return maybe?.name ?? maybe?.title ?? "Product";
}

function getPrices(p: Product): { price: number; was?: number } {
  const maybe = p as unknown as {
    price?: number; // Harga jual
    markup_price?: number; // Harga markup/asli
    // Fallback names
    selling_price?: number;
    compare_at_price?: number;
    original_price?: number;
  };

  // Prioritaskan 'price' sebagai harga jual
  const price = maybe.price ?? maybe.selling_price ?? 0;

  // Prioritaskan 'markup_price' sebagai harga coret
  const wasCandidate =
    maybe.markup_price ??
    maybe.compare_at_price ??
    maybe.original_price ??
    undefined;

  // Validasi: Harga coret harus lebih besar dari harga jual
  const safeWas =
    typeof wasCandidate === "number" && wasCandidate > price
      ? wasCandidate
      : undefined;

  return { price, was: safeWas };
}

function toSaleItem(p: Product): SaleItem {
  const { price, was } = getPrices(p);
  const slug = getProductSlug(p);
  return {
    id: String((p as unknown as { id?: number | string })?.id ?? slug),
    name: getProductName(p),
    price,
    was,
    href: `/products/${slug}`,
    image: getProductImage(p) ?? FALLBACK_IMG,
    desc: (p as unknown as { description?: string })?.description,
    rating: (p as unknown as { rating?: number })?.rating ?? undefined,
    reviews:
      (p as unknown as { reviews_count?: number })?.reviews_count ?? undefined,
    stock: (p as unknown as { stock?: number })?.stock ?? undefined,
    sku: (p as unknown as { sku?: string })?.sku ?? undefined,
  };
}

/* ================= Component Utama ================= */
export default function ProductSale() {
  const { data, isLoading, isError } = useGetProductListQuery({
    page: 1,
    paginate: 8,
    orderBy: "products.sales",
    order: "desc",
  });

  const items: SaleItem[] = useMemo(
    () => (data?.data ?? []).slice(0, 8).map(toSaleItem),
    [data?.data]
  );

  if (isLoading) {
    return (
      <section className="mx-auto container md:px-4 py-12 md:py-20 bg-white">
        <div className="flex items-end justify-between border-b border-gray-200 pb-4 mb-4">
          <div>
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-black md:text-4xl uppercase">
              Best Sellers
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Loading top-selling products…
            </p>
          </div>
          <div className="h-9 w-28 rounded-lg bg-gray-200" />
        </div>
        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg bg-gray-100" />
              <div className="mt-4 h-4 w-3/4 bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="mx-auto container md:px-4 py-12 md:py-20 bg-white">
        <div className="flex items-end justify-between border-b border-gray-200 pb-4 mb-4">
          <div>
            <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-black md:text-4xl uppercase">
              New Arrivals
            </h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Gagal memuat produk terlaris.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto container md:px-4 py-12 md:py-20 bg-white">
      {/* Header Section */}
      <div className="flex items-end justify-between border-b border-gray-200 pb-4 mb-4">
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-black md:text-4xl uppercase">
            New Arrivals
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {`Just Landed. Get Yours Before It's Gone`}
          </p>
        </div>
        <Link
          href="/product?sale=true"
          className="rounded-lg bg-black px-5 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-gray-800 border-2 border-black"
        >
          Lihat Semua
        </Link>
      </div>

      {/* Product Cards Grid */}
      <div className="mt-8 grid gap-2 md:gap-x-6 md:gap-y-10 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => {
          // Logika Diskon
          const hasDiscount = typeof p.was === "number" && p.was > p.price;
          const savePercentage = hasDiscount
            ? Math.round(((p.was! - p.price) / p.was!) * 100)
            : 0;

          return (
            <Link
              key={p.id}
              href={p.href}
              className="group text-left block focus:outline-none transition-all duration-300 relative"
            >
              <div className="relative overflow-hidden aspect-[3/4] bg-gray-50 border border-gray-100">
                <img
                  src={p.image ?? FALLBACK_IMG}
                  alt={p.name}
                  className="h-full w-full object-cover grayscale-[10%] transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Badge Diskon di Gambar (Opsional, tapi bagus untuk quick view) */}
                {hasDiscount && (
                  <span className="absolute left-0 top-0 inline-flex items-center rounded-br-lg bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                    Sale
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-col">
                <h3 className="text-base font-semibold text-black uppercase tracking-wide line-clamp-1">
                  {p.name}
                </h3>

                {/* --- TAMPILAN HARGA DISKON --- */}
                <div className="mt-1">
                  {hasDiscount ? (
                    <div className="flex flex-col items-start">
                      {/* Baris Harga: Jual (Merah) & Coret (Abu) */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-red-600">
                          {CURRENCY(p.price)}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {CURRENCY(p.was!)}
                        </span>
                      </div>
                      {/* Text Hemat */}
                      <span className="mt-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        Save {savePercentage}%
                      </span>
                    </div>
                  ) : (
                    /* Tampilan Normal */
                    <span className="text-lg font-extrabold text-black">
                      {CURRENCY(p.price)}
                    </span>
                  )}
                </div>
                {/* ----------------------------- */}
              </div>

              <span className="absolute bottom-0 left-0 h-[1px] w-full bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}