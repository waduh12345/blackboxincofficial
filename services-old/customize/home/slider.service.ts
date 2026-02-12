import { apiSecondSlice } from "@/services/base-query";
import { Slider } from "@/types/customization/home/slider";
// Parameter untuk GET
export interface SliderParams {
  client_code: string;
  bahasa?: string; // 'id' | 'en'
}

// Response Get All
export interface SliderListResponse {
  success: boolean;
  message: string;
  data: {
    items: Slider[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Create, Update)
export interface SliderDetailResponse {
  success: boolean;
  message: string;
  data: Slider;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const sliderApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get List
    // URL: /website/home/slider?client_code=...&bahasa=...
    getSliderList: builder.query<SliderListResponse, SliderParams>({
      query: (params) => ({
        url: "/website/home/slider",
        method: "GET",
        params: params,
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "Slider" as const,
                id,
              })),
              { type: "Slider", id: "LIST" },
            ]
          : [{ type: "Slider", id: "LIST" }],
    }),

    // ➕ Create (POST)
    // URL: /website/home/slider
    createSlider: builder.mutation<SliderDetailResponse, FormData>({
      query: (body) => ({
        url: "/website/home/slider",
        method: "POST",
        body: body, // FormData
      }),
      invalidatesTags: [{ type: "Slider", id: "LIST" }],
    }),

    // ✏️ Update (PUT)
    // URL: /website/home/slider/{id}
    updateSlider: builder.mutation<
      SliderDetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/home/slider/${id}`,
        method: "PUT",
        body: data, // FormData
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Slider", id: "LIST" },
        { type: "Slider", id },
      ],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetSliderListQuery,
  useCreateSliderMutation,
  useUpdateSliderMutation,
} = sliderApi;