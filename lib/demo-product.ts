import type { ListingProduct } from "@/components/product-listing-layout";

const IMG =
  "https://i.pinimg.com/1200x/dc/28/77/dc2877f08ba923ba34c8fa70bae94128.jpg";

const DEF_COLORS = [
  { name: "Maroon", hex: "#7f1d1d" },
  { name: "Hitam", hex: "#111827" },
  { name: "Putih", hex: "#F9FAFB" },
  { name: "Navy", hex: "#1f2937" },
];
const DEF_SIZES = ["S", "M", "L", "XL", "XXL"];

export const DEMO_PRODUCTS: ListingProduct[] = Array.from({ length: 42 }).map(
  (_v, i) => ({
    id: String(i + 1),
    name: `Produk ${i + 1}`,
    price: 199_000 + i * 20_000,
    was: 299_000 + i * 25_000,
    image: IMG,
    images: [IMG, IMG, IMG],
    href: `/product/${i + 1}`,
    rating: 4.6 + (i % 3) * 0.1,
    reviews: 100 + i * 7,
    stock: i % 7 === 0 ? 3 : i % 5 === 0 ? 0 : 10 + (i % 4), // ada yang menipis & habis
    sku: `BBX-${1000 + i}`,
    category: ["tshirt", "long-pants", "hoodie", "jacket"][i % 4],
    featured: i % 4 === 1,
    tags: i % 2 ? ["terbaru"] : ["terlaris"], // ada yang 'terbaru'
    colors: DEF_COLORS,
    sizes: DEF_SIZES,
    desc: "Material nyaman dipakai harian. Cutting rapi dan detail premium khas BLACKBOX.INC.",
  })
);