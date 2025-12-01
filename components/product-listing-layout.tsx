// components/layouts/ProductListingLayout.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  Filter,
  X,
  Star,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button"; // Asumsi Button sudah B&W
import FilterBlocks from "@/components/ui/block-filter"; // Asumsi ini sudah B&W
import Pagination from "@/components/ui/pagination"; // Asumsi ini sudah B&W
import ProductDetailModal from "./modal/product-detail-modal"; // Asumsi ini sudah B&W
import clsx from "clsx";

/* ---------- Types ---------- */
export type ListingProduct = {
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
  category?: string;
  featured?: boolean;
  tags?: string[];
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  desc: string;
};

type Chip = { label: string; slug: string };

type SortKey =
  | "terendah"
  | "tertinggi"
  | "terlaris"
  | "terbaru"
  | "diskon-terbesar";

/* ---------- Const & Helpers (B&W Styling) ---------- */
const DEF_COLORS = [
  { name: "Navy", hex: "#1f2937" },
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#F9FAFB" },
  { name: "Grey", hex: "#6b7280" },
];
const DEF_SIZES = ["S", "M", "L", "XL", "XXL"];
const PAGE_SIZE_DEFAULT = 10;
const LOW_STOCK_AT_DEFAULT = 5;
const IMG_FALLBACK =
  "https://via.placeholder.com/400x400/000000/FFFFFF?text=BLACKBOX.INC";

const CURRENCY = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

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
              filled ? "fill-black text-black" : "fill-transparent text-gray-300"
            }`}
          />
        );
      })}
    </div>
  );
}

/* ---------- Layout Component ---------- */
export default function ProductListingLayout({
  title,
  subtitle,
  products,
  chips,
  pageSize = PAGE_SIZE_DEFAULT,
  lowStockAt = LOW_STOCK_AT_DEFAULT,
  defaultSort = "terendah",
}: {
  title: string;
  subtitle: string;
  products: ListingProduct[];
  chips: Chip[];
  pageSize?: number;
  lowStockAt?: number;
  defaultSort?: SortKey;
}) {
  // filters/state
  const [query, setQuery] = useState("");
  const [chip, setChip] = useState<string | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [sort, setSort] = useState<SortKey>(defaultSort);
  const [priceRange, setPriceRange] = useState<
    "lt310" | "310to570" | "570to830" | "gte830" | null
  >(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // pagination
  const [page, setPage] = useState(1);

  // modal
  const [active, setActive] = useState<ListingProduct | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // compute filtered + sorted (logic remains the same)
  const list = useMemo(() => {
    let data = products.slice();

    // ... (Filter logic is unchanged) ...
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (chip && chip !== "semua") {
      if (chip === "low-stock") {
        data = data.filter(
          (p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= lowStockAt
        );
      } else if (chip === "newest") {
        const byTag = data.filter((p) =>
          p.tags?.some((t) => t.toLowerCase() === "terbaru")
        );
        data = byTag.length
          ? byTag
          : data.sort((a, b) => Number(b.id) - Number(a.id)).slice(0);
      } else {
        data = data.filter((p) => p.category === chip);
      }
    }

    if (inStockOnly) data = data.filter((p) => (p.stock ?? 0) > 0);
    if (featuredOnly) data = data.filter((p) => p.featured);
    if (onlyDiscount) data = data.filter((p) => (p.was ?? p.price) > p.price);

    if (priceRange) {
      data = data.filter((p) => {
        const price = p.price;
        switch (priceRange) {
          case "lt310":
            return price < 310_000;
          case "310to570":
            return price >= 310_000 && price < 570_000;
          case "570to830":
            return price >= 570_000 && price < 830_000;
          case "gte830":
            return price >= 830_000;
          default:
            return true;
        }
      });
    }

    // sorting (logic remains the same)
    data.sort((a, b) => {
      if (sort === "terendah") return a.price - b.price;
      if (sort === "tertinggi") return b.price - a.price;
      if (sort === "diskon-terbesar") {
        const da = ((a.was ?? a.price) - a.price) / (a.was ?? a.price);
        const db = ((b.was ?? b.price) - b.price) / (b.was ?? b.price);
        return db - da;
      }
      if (sort === "terlaris") return (b.reviews ?? 0) - (a.reviews ?? 0);
      return Number(b.id) - Number(a.id);
    });

    return data;
  }, [
    products,
    query,
    chip,
    inStockOnly,
    featuredOnly,
    onlyDiscount,
    priceRange,
    sort,
    lowStockAt,
  ]);

  // reset page saat filter berubah
  useEffect(() => {
    setPage(1);
  }, [query, chip, inStockOnly, featuredOnly, onlyDiscount, priceRange, sort]);

  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const startIdx = list.length ? (page - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(page * pageSize, list.length);
  const pageItems = useMemo(
    () => list.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize),
    [list, page, pageSize]
  );

  /* ===== Modal helpers (logic remains the same) ===== */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
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
  }, []);

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

  const total = useMemo(() => (active ? active.price * qty : 0), [active, qty]);

  /* ===== UI (B&W Styling) ===== */
  return (
    <main className="pb-16 bg-white">
      {/* Top bar */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-black uppercase">
                {title}
              </h1>
              <p className="text-sm text-gray-700">{subtitle}</p>
            </div>

            {/* Search + filter btn (mobile) */}
            <div className="flex w-full items-center gap-2 md:w-auto">
              {/* Search Input (B&W Style) */}
              <div className="group flex w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm ring-1 ring-transparent transition focus-within:ring-black/40 md:w-80">
                <SearchIcon className="h-4 w-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for items, categories, or tags…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400 text-black"
                  aria-label="Cari"
                />
              </div>
              {/* Filter Button (B&W Style) */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-50 md:hidden transition-colors"
              >
                <Filter className="h-4 w-4" /> Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category chips scroller */}
      {chips?.length > 0 && (
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto max-w-7xl px-4 py-4">
            <div className="relative">
              {/* Fading Edges B&W */}
              <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
                {chips.map((c) => {
                  const isActive =
                    (chip === null && c.slug === "semua") || chip === c.slug;
                  return (
                    <button
                      key={c.slug}
                      onClick={() =>
                        setChip((prev) =>
                          c.slug === "semua"
                            ? null
                            : prev === c.slug
                            ? null
                            : c.slug
                        )
                      }
                      // Chip Styling B&W
                      className={clsx(
                        "group inline-flex snap-start items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition whitespace-nowrap",
                        isActive
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:border-black/50"
                      )}
                      aria-pressed={isActive}
                    >
                      <span className="relative inline-block h-6 w-6 overflow-hidden rounded-full ring-1 ring-gray-300">
                        <img
                          src={IMG_FALLBACK}
                          alt={c.label}
                          className="h-full w-full object-cover grayscale" // Gambar grayscale
                        />
                      </span>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-6 py-8 md:grid-cols-[260px_1fr]">
          {/* Sidebar filter (desktop) */}
          <aside className="hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:block">
            {/* Asumsikan FilterBlocks sudah di-style B&W */}
            <FilterBlocks
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              featuredOnly={featuredOnly}
              setFeaturedOnly={setFeaturedOnly}
              onlyDiscount={onlyDiscount}
              setOnlyDiscount={setOnlyDiscount}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
          </aside>

          {/* Right: header controls + grid */}
          <section>
            {/* Sort row (B&W Style) */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <strong>
                  {startIdx}-{endIdx}
                </strong>{" "}
                of <strong>{list.length}</strong> products
                {chip ? (
                  <>
                    {" "}
                    in <span className="font-semibold">{chip}</span>
                  </>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Sort by:</span>
                <select
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-black font-medium"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="terendah">Price: Low to High</option>
                  <option value="tertinggi">Price: High to Low</option>
                  <option value="terlaris">Best Selling</option>
                  <option value="terbaru">Newest</option>
                  <option value="diskon-terbesar">Biggest Discount</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((p) => {
                const disc =
                  p.was && p.was > p.price
                    ? Math.max(0, Math.round(((p.was - p.price) / p.was) * 100))
                    : 0;
                const out = (p.stock ?? 0) <= 0;

                return (
                  <article
                    key={p.id}
                    // Card Styling B&W
                    className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
                  >
                    <button
                      type="button"
                      onClick={() => setActive(p)}
                      className="block text-left focus:outline-none"
                      aria-haspopup="dialog"
                      aria-label={`Quick view ${p.name}`}
                    >
                      <div className="relative">
                        <img
                          src={p.image ?? IMG_FALLBACK}
                          alt={p.name}
                          className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale-[10%]" // Grayscale image
                        />
                        {disc > 0 && (
                          // Discount Tag B&W
                          <span className="absolute left-3 top-3 inline-flex items-center rounded-lg bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                            -{disc}%
                          </span>
                        )}
                        {/* Wishlist Button B&W */}
                        <button
                          type="button"
                          aria-label="Add to wishlist"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(
                              new CustomEvent("wishlist:add", { detail: p })
                            );
                          }}
                          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-black shadow-sm hover:bg-white transition-colors"
                        >
                          <Heart className="h-4 w-4 fill-transparent hover:fill-black" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="line-clamp-1 font-semibold text-black uppercase tracking-wide">
                          {p.name}
                        </h3>
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex items-baseline gap-2">
                            {/* Price B&W */}
                            <span className="font-extrabold text-black text-lg">
                              {CURRENCY(p.price)}
                            </span>
                            {p.was && (
                              <span className="text-xs text-gray-500 line-through">
                                {CURRENCY(p.was)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <StarRating value={p.rating ?? 0} />
                            <span className="text-xs text-gray-500">
                              {p.reviews ?? 0}
                            </span>
                          </div>
                        </div>
                        {out ? (
                          // Out of stock B&W
                          <div className="mt-2 text-xs font-semibold text-red-600">
                            Sold out — notify me
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-gray-600">
                            Stock: {p.stock} • Ready to ship
                          </div>
                        )}
                        <div className="mt-4">
                          {/* Button B&W (assuming destructive is black) */}
                          <Button
                            size="lg"
                            variant="default" // Ubah ke default/black jika Button anda punya variant B&W
                            className="w-full bg-black text-white hover:bg-gray-800 uppercase tracking-wider font-bold"
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </button>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center">
              {/* Asumsikan Pagination sudah di-style B&W */}
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={(p) => setPage(p)}
              />
            </div>
          </section>
        </div>
      </div>

      {/* Drawer Filter (mobile - B&W Style) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop B&W */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Drawer Panel B&W */}
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm animate-[slideIn_200ms_ease-out] overflow-y-auto rounded-l-xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-black uppercase">
                Filter Options
              </h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100 text-black"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Asumsikan FilterBlocks sudah di-style B&W */}
            <FilterBlocks
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              featuredOnly={featuredOnly}
              setFeaturedOnly={setFeaturedOnly}
              onlyDiscount={onlyDiscount}
              setOnlyDiscount={setOnlyDiscount}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
            />
          </div>

          <style jsx>{`
            @keyframes slideIn {
              from {
                transform: translateX(16px);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      {/* Modal Detail */}
      <ProductDetailModal active={active} onClose={() => setActive(null)} />
    </main>
  );
}