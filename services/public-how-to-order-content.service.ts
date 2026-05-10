import { apiSlice } from "./base-query";
import type {
  HowToOrderContent,
  HowToOrderContentResponse,
} from "@/types/admin/how-to-order-content";

export const publicHowToOrderContentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPublicHowToOrderContent: builder.query<HowToOrderContent, void>({
      query: () => ({
        url: `/public/how-to-order-content`,
        method: "GET",
      }),
      transformResponse: (res: HowToOrderContentResponse) => res.data,
      providesTags: [{ type: "HowToOrderContent", id: "SINGLETON" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPublicHowToOrderContentQuery } = publicHowToOrderContentApi;
