"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useGetProductListQuery } from "@/services/product.service";
import type { Product as ApiProduct } from "@/types/admin/product";

const FALLBACK_IMG =
  "https://i.pinimg.com/1200x/dc/28/77/dc2877f08ba923ba34c8fa70bae94128.jpg";

type CardProduct = {
  id: string | number;
  name: string;
  price: number;
  markup_price: number; // Tambahkan ini
  href: string;
  image?: string | null;
};

const CURRENCY = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function NewArrival() {
  // NOTE: pakai sorting backend "products.sales" desc, max 8 item
  const { data, isLoading, isError } = useGetProductListQuery({
    page: 1,
    paginate: 8,
    orderBy: "products.sales",
    order: "desc",
  });

  const items = useMemo<CardProduct[]>(() => {
    const list: ApiProduct[] = data?.data ?? [];
    return list.map((p) => ({
      id: (p as { id?: number | string }).id ?? "",
      name:
        (p as { name?: string }).name ??
        (p as { title?: string }).title ??
        "Produk",
      price:
        (p as { price?: number }).price ??
        (p as { base_price?: number }).base_price ??
        0,
      // Mapping markup_price dari API
      markup_price: (p as { markup_price?: number }).markup_price ?? 0,
      href: `/products/${
        (p as { slug?: string }).slug ??
        (p as { id?: number | string }).id ??
        ""
      }`,
      image:
        (p as { thumbnail?: string | null }).thumbnail ??
        (p as { image?: string | null }).image ??
        FALLBACK_IMG,
    }));
  }, [data]);

  return (
    <section className="mx-auto container md:px-4 py-16 md:py-20 bg-white">
      <div className="flex items-end justify-between border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold tracking-tight text-black md:text-4xl uppercase">
            Best Sellers
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Exclusive picks—our most-loved items.
          </p>
        </div>
        <Link
          href="/product?sort=best"
          className="rounded-lg bg-black px-5 py-2 text-sm font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-gray-800 border-2 border-black"
        >
          Lihat Semua
        </Link>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center text-gray-500">
          Memuat produk…
        </div>
      )}
      {isError && (
        <div className="flex h-40 items-center justify-center text-red-600">
          Gagal memuat produk.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="mt-8 grid gap-2 md:gap-x-6 md:gap-y-10 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className="group block transition-all duration-300 relative"
            >
              <div className="relative overflow-hidden aspect-[3/4] bg-gray-50 border border-gray-100">
                <img
                  src={p.image ?? FALLBACK_IMG}
                  alt={p.name}
                  className="h-full w-full object-cover grayscale-[10%] transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute left-0 top-0 inline-flex items-center rounded-br-lg bg-black px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                  Best
                </span>
              </div>

              <div className="mt-4 flex flex-col">
                <h3 className="text-base font-semibold text-black uppercase tracking-wide line-clamp-1">
                  {p.name}
                </h3>

                {/* --- LOGIKA DISKON DIMULAI DISINI --- */}
                <div className="mt-1">
                  {p.markup_price > p.price ? (
                    <div className="flex flex-col items-start">
                      {/* Baris Harga: Jual (Merah) & Coret (Abu) */}
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-red-600">
                          {CURRENCY(p.price)}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          {CURRENCY(p.markup_price)}
                        </span>
                      </div>
                      {/* Badge Hemat */}
                      <span className="mt-1 inline-block rounded-sm bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                        Save{" "}
                        {Math.round(
                          ((p.markup_price - p.price) / p.markup_price) * 100
                        )}
                        %
                      </span>
                    </div>
                  ) : (
                    /* Tampilan Normal */
                    <span className="text-lg font-extrabold text-black">
                      {CURRENCY(p.price)}
                    </span>
                  )}
                </div>
                {/* --- LOGIKA DISKON BERAKHIR --- */}
              </div>

              <span className="absolute bottom-0 left-0 h-[1px] w-full bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            </Link>
          ))}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex h-40 items-center justify-center text-gray-500">
          Belum ada produk.
        </div>
      )}
    </section>
  );
}