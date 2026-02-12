import { apiSecondSlice } from "@/services/base-query";
import { FeatureSection } from "@/types/customization/home/why";

// Parameter untuk GET
export interface MengapaListParams {
  client_code: string;
  bahasa?: string; // 'id' | 'en'
}

// Response Get All
export interface MengapaListResponse {
  success: boolean;
  message: string;
  data: {
    items: FeatureSection[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Create, Update)
export interface MengapaDetailResponse {
  success: boolean;
  message: string;
  data: FeatureSection;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const mengapaApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get List
    // URL: /website/home/mengapa?client_code=...&bahasa=...
    getMengapaList: builder.query<MengapaListResponse, MengapaListParams>({
      query: (params) => ({
        url: "/website/home/mengapa",
        method: "GET",
        params: params, // client_code & bahasa masuk query string
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "Mengapa" as const,
                id,
              })),
              { type: "Mengapa", id: "LIST" },
            ]
          : [{ type: "Mengapa", id: "LIST" }],
    }),

    // ➕ Create (POST)
    // URL: /website/home/mengapa
    createMengapa: builder.mutation<MengapaDetailResponse, FormData>({
      query: (body) => ({
        url: "/website/home/mengapa",
        method: "POST",
        body: body, // FormData
      }),
      invalidatesTags: [{ type: "Mengapa", id: "LIST" }],
    }),

    // ✏️ Update (PUT)
    // URL: /website/home/mengapa/{id}
    updateMengapa: builder.mutation<
      MengapaDetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/home/mengapa/${id}`,
        method: "PUT",
        body: data, // FormData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Mengapa", id: "LIST" },
        { type: "Mengapa", id },
      ],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetMengapaListQuery,
  useCreateMengapaMutation,
  useUpdateMengapaMutation,
} = mengapaApi;