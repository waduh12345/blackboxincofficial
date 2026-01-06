// src/store/services/productVariantSizeApi.ts
import { apiSlice } from "../base-query";

/* ====== Types ====== */

// Sesuaikan tipe ini dengan respon backend sebenarnya
export interface ProductVariantSize {
  id: number;
  variant_id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  diameter: number;
  status: boolean | number;
  created_at?: string;
  updated_at?: string;
}

type PaginatedResponse<T> = {
  data: T[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
};

type ListParams = {
  variantId: string | number; // ID dari parent variant
  page?: number;
  paginate?: number;
  search?: string;
};

type GetByIdParams = {
  variantId: string | number;
  id: number | string;
};

type UpsertProductVariantSize =
  | {
      // Fields berdasarkan lampiran gambar
      name: string;
      sku: string;
      price: number;
      stock: number;
      weight: number;
      length: number;
      width: number;
      height: number;
      diameter: number;
      status: boolean | number; // 1/0 or true/false
    }
  | FormData;

/* ====== API ====== */
export const productVariantSizeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* 🔍 Get All Variant Sizes (paginated + search) */
    getProductVariantSizes: builder.query<
      PaginatedResponse<ProductVariantSize>,
      ListParams
    >({
      query: ({ variantId, page = 1, paginate = 10, search = "" }) => ({
        url: `/shop/products/variants/${variantId}/sizes`,
        method: "GET",
        params: { page, paginate, search },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: ProductVariantSize[];
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
      // Tagging berdasarkan variantId agar cache terisolasi per variant
      providesTags: (result, _err, { variantId }) =>
        result?.data
          ? [
              ...result.data.map((v) => ({
                type: "ProductVariantSize" as const,
                id: `${variantId}-${v.id}`,
              })),
              { type: "ProductVariantSize" as const, id: `${variantId}-LIST` },
            ]
          : [{ type: "ProductVariantSize" as const, id: `${variantId}-LIST` }],
    }),

    /* 🔎 Get Variant Size by ID */
    getProductVariantSizeById: builder.query<ProductVariantSize, GetByIdParams>(
      {
        query: ({ variantId, id }) => ({
          url: `/shop/products/variants/${variantId}/sizes/${id}`,
          method: "GET",
        }),
        transformResponse: (response: {
          code: number;
          message: string;
          data: ProductVariantSize;
        }) => response.data,
        providesTags: (_res, _err, { variantId, id }) => [
          { type: "ProductVariantSize" as const, id: `${variantId}-${id}` },
        ],
      }
    ),

    /* ➕ Create Variant Size */
    createProductVariantSize: builder.mutation<
      ProductVariantSize,
      { variantId: string | number; body: UpsertProductVariantSize }
    >({
      query: ({ variantId, body }) => ({
        url: `/shop/products/variants/${variantId}/sizes`,
        method: "POST",
        body,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ProductVariantSize;
      }) => response.data,
      invalidatesTags: (_res, _err, { variantId }) => [
        { type: "ProductVariantSize" as const, id: `${variantId}-LIST` },
      ],
    }),

    /* ✏️ Update Variant Size */
    updateProductVariantSize: builder.mutation<
      ProductVariantSize,
      {
        variantId: string | number;
        id: number | string;
        body: UpsertProductVariantSize;
      }
    >({
      // Menggunakan pola POST + _method=PUT sesuai contoh (untuk support FormData/Laravel)
      query: ({ variantId, id, body }) => ({
        url: `/shop/products/variants/${variantId}/sizes/${id}?_method=PUT`,
        method: "POST",
        body,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ProductVariantSize;
      }) => response.data,
      invalidatesTags: (_res, _err, { variantId, id }) => [
        { type: "ProductVariantSize" as const, id: `${variantId}-${id}` },
        { type: "ProductVariantSize" as const, id: `${variantId}-LIST` },
      ],
    }),

    /* ❌ Delete Variant Size */
    deleteProductVariantSize: builder.mutation<
      { code: number; message: string },
      { variantId: string | number; id: number | string }
    >({
      query: ({ variantId, id }) => ({
        url: `/shop/products/variants/${variantId}/sizes/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => ({ code: response.code, message: response.message }),
      invalidatesTags: (_res, _err, { variantId, id }) => [
        { type: "ProductVariantSize" as const, id: `${variantId}-${id}` },
        { type: "ProductVariantSize" as const, id: `${variantId}-LIST` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductVariantSizesQuery,
  useGetProductVariantSizeByIdQuery,
  useCreateProductVariantSizeMutation,
  useUpdateProductVariantSizeMutation,
  useDeleteProductVariantSizeMutation,
} = productVariantSizeApi;