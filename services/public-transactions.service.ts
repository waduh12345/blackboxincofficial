import { apiSlice } from "@/services/base-query";

/** ===== Types persis payload publik ===== */

export interface ProductMedia {
  id: number;
  model_type: string;
  model_id: number;
  uuid: string;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  size: number;
  order_column: number;
  created_at: string;
  updated_at: string;
  original_url: string;
  preview_url?: string;
}

export interface Product {
  id: number;
  shop_id?: number;
  product_category_id?: number;
  product_merk_id?: number;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  sales?: number;
  stock?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  diameter?: number;
  rating?: number;
  total_reviews?: number;
  status?: number;
  created_at?: string;
  updated_at?: string;
  image?: string;
  image_2?: string;
  image_3?: string;
  media?: ProductMedia[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku: string;
  price: string;
  sales?: number;
  stock?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  diameter?: number;
  rating?: string;
  total_reviews?: number;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopDetail {
  id: number;
  transaction_id: number;
  transaction_shop_id?: number;
  product_id: number;
  product_variant_id: number | null;
  product_detail?: string | null; // JSON string of variant detail
  price: number;
  quantity: number;
  total: number;
  created_at?: string;
  updated_at?: string;
  product?: Product;
  product_variant?: ProductVariant;
}

export interface ShopInfo {
  id: number;
  user_id: number;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
  rating?: number;
  total_reviews?: number;
  rajaongkir_province_id?: number;
  rajaongkir_city_id?: number;
  rajaongkir_district_id?: number;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShopPayload {
  id: number;
  transaction_id: number;
  shop_id: number;
  receipt_code: string | null;
  courier: string;
  shipment_detail: string | null; // JSON string
  shipment_parameter: string | null; // JSON string
  total: number;
  shipment_cost: number;
  grand_total?: number;
  shipment_status?: number;
  created_at?: string;
  updated_at?: string;
  shop?: ShopInfo;
  shipments?: unknown[];
  details: ShopDetail[];
}

export interface Transaction {
  id: number;
  user_id: number | string | null;
  reference: string;
  encypted_id?: string;
  ref_number?: number;
  total: number;
  discount_total: number;
  shipment_cost: number;
  grand_total: number;
  order_id?: string;
  payment_link?: string | null;
  expires_at?: string;
  paid_at?: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  address_line_1: string;
  address_line_2?: string | null;
  postal_code?: string;
  payment_type?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  district_name?: string;
  city_name?: string;
  province_name?: string;
  courier?: string;
  service?: string;
  shipping_cost?: number;
  resi_number?: string | null;

  // NOTE: response uses "shops" (not "stores")
  shops?: ShopPayload[];
}

export interface TransactionDetail {
  product_id?: number;
  product_variant_id?: number;
  quantity: number;
}

export interface ShipmentInfo {
  parameter: string; // JSON.stringify dari parameter ongkir
  shipment_detail: string; // JSON.stringify dari detail ongkir
  courier: string; // jne | pos | tiki
  cost: number;
}

export interface TransactionData {
  shop_id: number;
  details: TransactionDetail[];
  shipment: ShipmentInfo;
}

export interface CreatePublicTransactionRequest {
  address_line_1: string;
  address_line_2?: string;
  postal_code: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  payment_type: string;
  data: TransactionData[];
  voucher?: number[]; // ← array of id (sesuai contoh payload)
}

export interface CreateTransactionResponse {
  success: boolean;
  message: string;
  data: Transaction | Transaction[];
}

/** ===== tambahan tipe untuk update via form ===== */
/**
 * Untuk endpoint update yang dikirim sebagai FormData, kita mengijinkan payload bertipe FormData.
 * Dalam penggunaan, panggil mutation dengan objek { id, formData }.
 */
export interface UpdatePublicTransactionPayload {
  id: number | string;
  formData: FormData;
}

export const publicTransactionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPublicTransaction: builder.mutation<
      CreateTransactionResponse,
      CreatePublicTransactionRequest
    >({
      query: (payload) => ({
        url: `/public/transaction`,
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (res: {
        code: number;
        message: string;
        data: Transaction | Transaction[];
      }): CreateTransactionResponse => ({
        success: res.code === 200 || res.code === 201,
        message: res.message,
        data: res.data,
      }),
    }),

    getPublicTransactionById: builder.query<Transaction, string | number>({
      query: (id) => ({
        url: `/public/transaction/${id}`,
        method: "GET",
        params: { include: "details.product" },
      }),
      transformResponse: (res: {
        code: number;
        message: string;
        data: Transaction;
      }) => res.data,
    }),

    /** === NEW: GET by reference === */
    getPublicTransactionByReference: builder.query<Transaction, string>({
      query: (reference) => ({
        url: `/public/transaction/reference/${encodeURIComponent(reference)}`,
        method: "GET",
        params: { include: "details.product" },
      }),
      transformResponse: (res: {
        code: number;
        message: string;
        data: Transaction;
      }) => res.data,
    }),

    /** === NEW: Update via POST + _method=PUT with FormData ===
     * Usage: call mutation with { id, formData }
     * Important: do NOT set Content-Type header for FormData; browser will set boundary.
     */
    updatePublicTransactionWithForm: builder.mutation<
      CreateTransactionResponse,
      UpdatePublicTransactionPayload
    >({
      query: ({ id, formData }) => ({
        url: `/public/transaction/${id}?_method=PUT`, // Correct method for updating using FormData
        method: "POST", // POST is used, but with _method=PUT query parameter
        params: { _method: "PUT" }, // Indicates the real method
        body: formData,
        // Don't manually set "Content-Type" for FormData
      }),
      transformResponse: (res: {
        code: number;
        message: string;
        data: Transaction | Transaction[];
      }): CreateTransactionResponse => ({
        success: res.code === 200 || res.code === 201,
        message: res.message,
        data: res.data,
      }),
    }),
  }),
});

export const {
  useCreatePublicTransactionMutation,
  useGetPublicTransactionByIdQuery,
  useLazyGetPublicTransactionByIdQuery,
  useGetPublicTransactionByReferenceQuery,
  useUpdatePublicTransactionWithFormMutation,
} = publicTransactionApi;