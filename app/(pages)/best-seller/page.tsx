import ProductListingLayout from "@/components/product-listing-layout";
import { DEMO_PRODUCTS } from "@/lib/demo-product";

const chips = [
  { label: "Semua", slug: "semua" },
  { label: "Tshirt", slug: "tshirt" },
  { label: "Trousers", slug: "long-pants" },
  { label: "Hoodie", slug: "hoodie" },
  { label: "Jacket", slug: "jacket" },
  { label: "Stok Menipis", slug: "low-stock" },
  { label: "Terbaru", slug: "newest" },
];

export default function Page() {
  return (
    <ProductListingLayout
      title="Best Seller"
      subtitle="Produk-produk paling diminati di BLACKBOX.INC."
      products={DEMO_PRODUCTS}
      chips={chips}
      pageSize={10}
      defaultSort="terlaris"
    />
  );
}