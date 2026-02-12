// src/store/services/productVariantApi.ts
import { apiSlice } from "../base-query";
import type { ProductVariant } from "@/types/admin/product-variant";

/* ====== Types ====== */
type PaginatedResponse<T> = {
  data: T[];
  last_page: number;
  current_page: number;
  total: number;
  per_page: number;
};

type ListParams = {
  productSlug: string;
  page?: number;
  paginate?: number;
  search?: string;
};

type GetByIdParams = {
  productSlug: string;
  id: number | string;
};

type UpsertVariant =
  | {
      // Minimal fields untuk create/update
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
      // optional
      product_id?: number;
      rating?: number;
      total_reviews?: number;
      image?: File | string | null;
    }
  | FormData;

/* ====== API ====== */
export const productVariantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* 🔍 Get All Variants (paginated + search) */
    getProductVariants: builder.query<
      PaginatedResponse<ProductVariant>,
      ListParams
    >({
      query: ({ productSlug, page = 1, paginate = 10, search = "" }) => ({
        url: `/shop/products/${productSlug}/variants`,
        method: "GET",
        params: { page, paginate, search },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: ProductVariant[];
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
      providesTags: (result, _err, { productSlug }) =>
        result?.data
          ? [
              ...result.data.map((v) => ({
                type: "ProductVariant" as const,
                id: `${productSlug}-${v.id}`,
              })),
              { type: "ProductVariant" as const, id: `${productSlug}-LIST` },
            ]
          : [{ type: "ProductVariant" as const, id: `${productSlug}-LIST` }],
    }),

    /* 🔎 Get Variant by ID */
    getProductVariantById: builder.query<ProductVariant, GetByIdParams>({
      query: ({ productSlug, id }) => ({
        url: `/shop/products/${productSlug}/variants/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ProductVariant;
      }) => response.data,
      providesTags: (_res, _err, { productSlug, id }) => [
        { type: "ProductVariant" as const, id: `${productSlug}-${id}` },
      ],
    }),

    /* ➕ Create Variant */
    createProductVariant: builder.mutation<
      ProductVariant,
      { productSlug: string; body: UpsertVariant }
    >({
      query: ({ productSlug, body }) => ({
        url: `/shop/products/${productSlug}/variants`,
        method: "POST",
        body,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ProductVariant;
      }) => response.data,
      invalidatesTags: (_res, _err, { productSlug }) => [
        { type: "ProductVariant" as const, id: `${productSlug}-LIST` },
      ],
    }),

    /* ✏️ Update Variant */
    updateProductVariant: builder.mutation<
      ProductVariant,
      { productSlug: string; id: number | string; body: UpsertVariant }
    >({
      // gunakan POST + _method=PUT (aman untuk FormData ala Laravel)
      query: ({ productSlug, id, body }) => ({
        url: `/shop/products/${productSlug}/variants/${id}?_method=PUT`,
        method: "POST",
        body,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ProductVariant;
      }) => response.data,
      invalidatesTags: (_res, _err, { productSlug, id }) => [
        { type: "ProductVariant" as const, id: `${productSlug}-${id}` },
        { type: "ProductVariant" as const, id: `${productSlug}-LIST` },
      ],
    }),

    /* ❌ Delete Variant */
    deleteProductVariant: builder.mutation<
      { code: number; message: string },
      { productSlug: string; id: number | string }
    >({
      query: ({ productSlug, id }) => ({
        url: `/shop/products/${productSlug}/variants/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: null;
      }) => ({ code: response.code, message: response.message }),
      invalidatesTags: (_res, _err, { productSlug, id }) => [
        { type: "ProductVariant" as const, id: `${productSlug}-${id}` },
        { type: "ProductVariant" as const, id: `${productSlug}-LIST` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductVariantsQuery,
  useGetProductVariantByIdQuery,
  useCreateProductVariantMutation,
  useUpdateProductVariantMutation,
  useDeleteProductVariantMutation,
} = productVariantApi;