import { apiSlice } from "../base-query";
import type {
  AddStockRequest,
  AddStockToVariantRequest,
  StockHistoryItem,
} from "@/types/admin/stock";

/* ====== Types ====== */

type PaginatedResponse<T> = {
  data: T[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
};

type StockHistoryParams = {
  variantSizeId: number;
  page?: number;
  paginate?: number;
};

/* ====== API ====== */
export const stockApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ➕ Add Stock to Variant Size */
    addStockToVariantSize: builder.mutation<
      { code: number; message: string },
      AddStockRequest
    >({
      query: ({ id, quantity, description }) => ({
        url: `/shop/stock/variant-size/${id}/add`,
        method: "POST",
        body: { quantity, description },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: unknown;
      }) => ({ code: response.code, message: response.message }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "ProductVariantSize" as const, id: `SIZE-${id}` },
        { type: "StockHistory" as const, id: `SIZE-${id}` },
      ],
    }),

    /* ➕ Add Stock to Variant (targeting a specific size) */
    addStockToVariant: builder.mutation<
      { code: number; message: string },
      AddStockToVariantRequest
    >({
      query: ({ id, quantity, description, product_variant_size_id }) => ({
        url: `/shop/stock/variant/${id}/add`,
        method: "POST",
        body: { quantity, description, product_variant_size_id },
        headers: { "Content-Type": "application/json" },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: unknown;
      }) => ({ code: response.code, message: response.message }),
      invalidatesTags: (_res, _err, { id, product_variant_size_id }) => [
        { type: "ProductVariant" as const, id: `VARIANT-${id}` },
        {
          type: "ProductVariantSize" as const,
          id: `SIZE-${product_variant_size_id}`,
        },
        {
          type: "StockHistory" as const,
          id: `SIZE-${product_variant_size_id}`,
        },
      ],
    }),

    /* 🔍 Get Stock Card History for a Variant Size */
    getStockHistory: builder.query<
      PaginatedResponse<StockHistoryItem>,
      StockHistoryParams
    >({
      query: ({ variantSizeId, page = 1, paginate = 10 }) => ({
        url: `/shop/stock/variant-size/${variantSizeId}/history`,
        method: "GET",
        params: { page, paginate },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: StockHistoryItem[];
          last_page: number;
          total: number;
          per_page: number;
        };
      }) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
      providesTags: (_res, _err, { variantSizeId }) => [
        { type: "StockHistory" as const, id: `SIZE-${variantSizeId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useAddStockToVariantSizeMutation,
  useAddStockToVariantMutation,
  useGetStockHistoryQuery,
} = stockApi;
