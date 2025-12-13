import { apiSecondSlice } from "@/services/base-query";
import { About } from "@/types/customization/home/about";

// Parameter untuk GET
export interface HomeAboutParams {
  client_code: string;
  bahasa?: string; // 'id' | 'en'
}

// Response Get All
export interface HomeAboutListResponse {
  success: boolean;
  message: string;
  data: {
    items: About[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Create, Update)
export interface HomeAboutDetailResponse {
  success: boolean;
  message: string;
  data: About;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const homeAboutApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get List
    // URL: /website/home/tentang?client_code=...&bahasa=...
    getHomeAboutList: builder.query<HomeAboutListResponse, HomeAboutParams>({
      query: (params) => ({
        url: "/website/home/tentang",
        method: "GET",
        params: params,
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "HomeAbout" as const,
                id,
              })),
              { type: "HomeAbout", id: "LIST" },
            ]
          : [{ type: "HomeAbout", id: "LIST" }],
    }),

    // ➕ Create (POST)
    // URL: /website/home/tentang
    createHomeAbout: builder.mutation<HomeAboutDetailResponse, FormData>({
      query: (body) => ({
        url: "/website/home/tentang",
        method: "POST",
        body: body, // Pastikan mengirim FormData karena ada image
      }),
      invalidatesTags: [{ type: "HomeAbout", id: "LIST" }],
    }),

    // ✏️ Update (PUT)
    // URL: /website/home/tentang/{id}
    // Mengasumsikan update membutuhkan ID spesifik di URL sesuai best practice REST
    updateHomeAbout: builder.mutation<
      HomeAboutDetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/home/tentang/${id}`, // Menambahkan ID di URL
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "HomeAbout", id: "LIST" },
        { type: "HomeAbout", id },
      ],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetHomeAboutListQuery,
  useCreateHomeAboutMutation,
  useUpdateHomeAboutMutation,
} = homeAboutApi;