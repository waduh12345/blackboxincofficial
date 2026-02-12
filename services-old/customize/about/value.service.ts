import { apiSecondSlice } from "@/services/base-query";
import { Value } from "@/types/customization/about/value";

// Parameter untuk GET
export interface ValueParams {
  client_code: string;
  bahasa?: string; // 'id' | 'en'
}

// Response Get All
export interface ValueListResponse {
  success: boolean;
  message: string;
  data: {
    items: Value[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Create, Update)
export interface ValueDetailResponse {
  success: boolean;
  message: string;
  data: Value;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const valuesApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get List
    // URL: /website/profile/nilai?client_code=...&bahasa=...
    getValueList: builder.query<ValueListResponse, ValueParams>({
      query: (params) => ({
        url: "/website/profile/nilai",
        method: "GET",
        params: params, // client_code & bahasa masuk query string
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "Value" as const,
                id,
              })),
              { type: "Value", id: "LIST" },
            ]
          : [{ type: "Value", id: "LIST" }],
    }),

    // ➕ Create (POST)
    // URL: /website/profile/nilai
    createValue: builder.mutation<ValueDetailResponse, FormData>({
      query: (body) => ({
        url: "/website/profile/nilai",
        method: "POST",
        body: body, // FormData
      }),
      invalidatesTags: [{ type: "Value", id: "LIST" }],
    }),

    // ✏️ Update (PUT)
    // URL: /website/profile/nilai/{id}
    updateValue: builder.mutation<
      ValueDetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/profile/nilai/${id}`,
        method: "PUT",
        body: data, // FormData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Value", id: "LIST" },
        { type: "Value", id },
      ],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetValueListQuery,
  useCreateValueMutation,
  useUpdateValueMutation,
} = valuesApi;