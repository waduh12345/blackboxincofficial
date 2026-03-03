export interface AddStockRequest {
  id: number;
  quantity: number;
  description?: string;
}

export interface AddStockToVariantRequest {
  id: number;
  quantity: number;
  description?: string;
  product_variant_size_id: number;
}

export interface StockHistoryItem {
  id: number;
  product_variant_size_id: number;
  quantity: number;
  type: string; // "in" | "out"
  description: string;
  created_at: string;
  updated_at: string;
}
