import { apiSlice } from "../base-query";
import type {
  HowToOrderContent,
  HowToOrderContentResponse,
} from "@/types/admin/how-to-order-content";

export const howToOrderContentAdminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHowToOrderContent: builder.query<HowToOrderContent, void>({
      query: () => ({
        url: `/web/how-to-order-content`,
        method: "GET",
      }),
      transformResponse: (res: HowToOrderContentResponse) => res.data,
      providesTags: [{ type: "HowToOrderContent", id: "SINGLETON" }],
    }),

    updateHowToOrderContent: builder.mutation<
      HowToOrderContent,
      FormData | Partial<HowToOrderContent>
    >({
      query: (payload) => ({
        url: `/web/how-to-order-content?_method=PUT`,
        method: "POST",
        body: payload,
        ...(payload instanceof FormData
          ? {}
          : { headers: { "Content-Type": "application/json" } }),
      }),
      transformResponse: (res: HowToOrderContentResponse) => res.data,
      invalidatesTags: [{ type: "HowToOrderContent", id: "SINGLETON" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetHowToOrderContentQuery,
  useUpdateHowToOrderContentMutation,
} = howToOrderContentAdminApi;
