import { ProductCategory } from "../master/product-category";
import { ProductMerk } from "../master/product-merk";

export interface ProductMedia {
  id: number;
  model_type: string;
  model_id: number;
  uuid: string;
  collection_name: string;
  name:string;
  file_name: string;
  mime_type:string;
  disk: string;
  conversions_disk: string;
  size: number;
  order_column: number;
  created_at: string;
  updated_at: string;
  original_url: string;
  preview_url: string;
}

export interface Product {
  id: number;
  shop_id: number | string | null;
  sku?: string | null;
  product_variant_id?: number | null;
  product_category_id: number | null;
  product_category: ProductCategory;
  product_merk_id: number | null;
  product_merk: ProductMerk;
  category_name: string;
  category_slug: string;
  postal_code: string;
  address_line_1: string;
  merk_name: string;
  merk_slug: string;
  name: string;
  slug: string;
  quantity: number;
  description: string;
  price: number;
  harga_coret: number;
  rating: number | string;
  total_reviews: number;
  stock: number;
  duration?: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  diameter: number;
  status: boolean | number;
  image: File | string | null;
  image_2: File | string | null;
  image_3: File | string | null;
  image_4: File | string | null;
  image_5: File | string | null;
  image_6: File | string | null;
  image_7: File | string | null;
  was?: number;

  /**
   * Diisi oleh endpoint publik: price/harga_coret/stock di atas sudah berupa
   * nilai efektif (produk -> varian -> ukuran), sementara base_* adalah angka
   * mentah yang tersimpan di baris produk.
   */
  price_min?: number;
  price_max?: number;
  has_variants?: boolean;
  base_price?: number;
  base_harga_coret?: number;
  base_stock?: number;

  kecamatan?: string;
  terlaris?: boolean;
  terbaru?: boolean;
}