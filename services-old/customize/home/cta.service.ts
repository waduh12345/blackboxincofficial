import { apiSecondSlice } from "@/services/base-query";
import { CTA } from "@/types/customization/home/cta";
// Parameter untuk GET
export interface CTAListParams {
  client_code: string;
  bahasa?: string; // 'id' | 'en'
}

// Response Get All
export interface CTAListResponse {
  success: boolean;
  message: string;
  data: {
    items: CTA[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Create, Update)
export interface CTADetailResponse {
  success: boolean;
  message: string;
  data: CTA;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const ctaApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get List
    // URL: /website/home/cta?client_code=...&bahasa=...
    getCTAList: builder.query<CTAListResponse, CTAListParams>({
      query: (params) => ({
        url: "/website/home/cta",
        method: "GET",
        params: params, // client_code & bahasa masuk query string
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "CTA" as const,
                id,
              })),
              { type: "CTA", id: "LIST" },
            ]
          : [{ type: "CTA", id: "LIST" }],
    }),

    // ➕ Create (POST)
    // URL: /website/home/cta
    createCTA: builder.mutation<CTADetailResponse, FormData>({
      query: (body) => ({
        url: "/website/home/cta",
        method: "POST",
        body: body, // FormData
      }),
      invalidatesTags: [{ type: "CTA", id: "LIST" }],
    }),

    // ✏️ Update (PUT)
    // URL: /website/home/cta/{id}
    updateCTA: builder.mutation<
      CTADetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/home/cta/${id}`,
        method: "PUT",
        body: data, // FormData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "CTA", id: "LIST" },
        { type: "CTA", id },
      ],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetCTAListQuery,
  useCreateCTAMutation,
  useUpdateCTAMutation,
} = ctaApi;