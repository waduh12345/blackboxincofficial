import { apiSecondSlice } from "@/services/base-query";
import { ContentSection } from "@/types/customization/home/hero";

// Tambahkan param bahasa
export interface HeroListParams {
  client_code: string;
  bahasa?: string; // Optional string ('id' | 'en')
}

export interface HeroListResponse {
  success: boolean;
  message: string;
  data: {
    items: ContentSection[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

export interface HeroDetailResponse {
  success: boolean;
  message: string;
  data: ContentSection;
}

export const heroApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get Hero List (Updated params)
    getHeroList: builder.query<HeroListResponse, HeroListParams>({
      query: (params) => ({
        url: "/website/home/hero",
        method: "GET",
        params: params, // Params akan otomatis menyertakan bahasa jika ada
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "Hero" as const,
                id,
              })),
              { type: "Hero", id: "LIST" },
            ]
          : [{ type: "Hero", id: "LIST" }],
    }),

    createHero: builder.mutation<HeroDetailResponse, FormData>({
      query: (body) => ({
        url: "/website/home/hero",
        method: "POST",
        body: body,
      }),
      invalidatesTags: [{ type: "Hero", id: "LIST" }],
    }),

    updateHero: builder.mutation<
      HeroDetailResponse,
      { id: number | string; data: FormData }
    >({
      query: ({ id, data }) => ({
        url: `/website/home/hero/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Hero", id: "LIST" },
        { type: "Hero", id },
      ],
    }),
  }),
});

export const {
  useGetHeroListQuery,
  useCreateHeroMutation,
  useUpdateHeroMutation,
} = heroApi;