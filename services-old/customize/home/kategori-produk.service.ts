import { apiSecondSlice } from "@/services/base-query";
import { KategoriProduk } from "@/types/customization/home/kategori-produk";

// Parameter untuk GET
export interface KategoriProdukListParams {
  client_code: string;
  bahasa?: string; // Optional string ('id' | 'en')
}

// Response Get All
export interface KategoriProdukListResponse {
  success: boolean;
  message: string;
  data: {
    items: KategoriProduk[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Create, Update)
export interface KategoriProdukDetailResponse {
  success: boolean;
  message: string;
  data: KategoriProduk;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const kategoriProdukApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get Kategori Produk List
    // URL: /website/home/kategori-produk?client_code=...&bahasa=...
    getKategoriProdukList: builder.query<
      KategoriProdukListResponse,
      KategoriProdukListParams
    >({
      query: (params) => ({
        url: "/website/home/kategori-produk",
        method: "GET",
        params: params, // Params akan otomatis menyertakan client_code dan bahasa
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "KategoriProduk" as const,
                id,
              })),
              { type: "KategoriProduk", id: "LIST" },
            ]
          : [{ type: "KategoriProduk", id: "LIST" }],
    }),

    // ➕ Create Kategori Produk
    // URL: /website/home/kategori-produk
    createKategoriProduk: builder.mutation<
      KategoriProdukDetailResponse,
      FormData
    >({
      query: (body) => ({
        url: "/website/home/kategori-produk",
        method: "POST",
        body: body, // Body berupa FormData
      }),
      invalidatesTags: [{ type: "KategoriProduk", id: "LIST" }],
    }),

    // ✏️ Update Kategori Produk
    // URL: /website/home/kategori-produk/{id}
    updateKategoriProduk: builder.mutation<
      KategoriProdukDetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/home/kategori-produk/${id}`,
        method: "PUT",
        body: data, // Body berupa FormData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "KategoriProduk", id: "LIST" },
        { type: "KategoriProduk", id },
      ],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetKategoriProdukListQuery,
  useCreateKategoriProdukMutation,
  useUpdateKategoriProdukMutation,
} = kategoriProdukApi;