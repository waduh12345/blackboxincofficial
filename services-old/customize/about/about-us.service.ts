import { apiSecondSlice } from "@/services/base-query";
import { AboutUs } from "@/types/customization/about/tentang";

// Parameter untuk GET
export interface AboutUsParams {
  client_code: string;
  bahasa?: string; // 'id' | 'en'
}

// Response Get All
export interface AboutUsListResponse {
  success: boolean;
  message: string;
  data: {
    items: AboutUs[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Create, Update)
export interface AboutUsDetailResponse {
  success: boolean;
  message: string;
  data: AboutUs;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const aboutUsApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get List
    // URL: /website/profile/tentang?client_code=...&bahasa=...
    getAboutUsList: builder.query<AboutUsListResponse, AboutUsParams>({
      query: (params) => ({
        url: "/website/profile/tentang",
        method: "GET",
        params: params,
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "AboutUs" as const,
                id,
              })),
              { type: "AboutUs", id: "LIST" },
            ]
          : [{ type: "AboutUs", id: "LIST" }],
    }),

    // ➕ Create (POST)
    // URL: /website/profile/tentang
    createAboutUs: builder.mutation<AboutUsDetailResponse, FormData>({
      query: (body) => ({
        url: "/website/profile/tentang",
        method: "POST",
        body: body, // FormData
      }),
      invalidatesTags: [{ type: "AboutUs", id: "LIST" }],
    }),

    // ✏️ Update (PUT)
    // URL: /website/profile/tentang/{id}
    updateAboutUs: builder.mutation<
      AboutUsDetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/profile/tentang/${id}`,
        method: "PUT",
        body: data, // FormData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AboutUs", id: "LIST" },
        { type: "AboutUs", id },
      ],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetAboutUsListQuery,
  useCreateAboutUsMutation,
  useUpdateAboutUsMutation,
} = aboutUsApi;