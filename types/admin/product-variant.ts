export interface ProductVariant {
  id: number;
  product_id: number;

  // Variant info
  name: string;
  sku: string;

  // Pricing & inventory
  price: number; // in IDR
  stock: number;

  image?: string | null;

  // Shipping dimensions (typically in mm / gram)
  weight: number; // gram
  length: number; // mm
  width: number; // mm
  height: number; // mm
  diameter: number; // mm

  // Rating
  rating: number; // 0..5
  total_reviews: number;

  // Status (0=inactive, 1=active)
  status: boolean | number;
  created_at: string;
  updated_at: string;
  product_name: string;
  product_slug: string;
  shop_name: string;
  shop_slug: string;
}