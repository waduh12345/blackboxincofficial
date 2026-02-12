import { apiSecondSlice } from "@/services/base-query";
import { Product } from "@/types/customization/home/product";
// Parameter untuk GET
export interface ProductListParams {
  client_code: string;
  bahasa?: string; // 'id' | 'en'
}

// Response Get All
export interface ProductListResponse {
  success: boolean;
  message: string;
  data: {
    items: Product[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Create, Update)
export interface ProductDetailResponse {
  success: boolean;
  message: string;
  data: Product;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const produkApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get List
    // URL: /website/home/produk?client_code=...&bahasa=...
    getProdukList: builder.query<ProductListResponse, ProductListParams>({
      query: (params) => ({
        url: "/website/home/produk",
        method: "GET",
        params: params, // client_code & bahasa masuk query string
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "Produk" as const,
                id,
              })),
              { type: "Produk", id: "LIST" },
            ]
          : [{ type: "Produk", id: "LIST" }],
    }),

    // ➕ Create (POST)
    // URL: /website/home/produk
    createProduk: builder.mutation<ProductDetailResponse, FormData>({
      query: (body) => ({
        url: "/website/home/produk",
        method: "POST",
        body: body, // FormData (pastikan client_id: 5 di-append di sini dari sisi component)
      }),
      invalidatesTags: [{ type: "Produk", id: "LIST" }],
    }),

    // ✏️ Update (PUT)
    // URL: /website/home/produk/{id}
    updateProduk: builder.mutation<
      ProductDetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/home/produk/${id}`,
        method: "PUT",
        body: data, // FormData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Produk", id: "LIST" },
        { type: "Produk", id },
      ],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetProdukListQuery,
  useCreateProdukMutation,
  useUpdateProdukMutation,
} = produkApi;