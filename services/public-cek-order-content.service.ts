import { apiSlice } from "./base-query";
import type {
  CekOrderContent,
  CekOrderContentResponse,
} from "@/types/admin/cek-order-content";

export const publicCekOrderContentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPublicCekOrderContent: builder.query<CekOrderContent, void>({
      query: () => ({
        url: `/public/cek-order-content`,
        method: "GET",
      }),
      transformResponse: (res: CekOrderContentResponse) => res.data,
      providesTags: [{ type: "CekOrderContent", id: "SINGLETON" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetPublicCekOrderContentQuery } = publicCekOrderContentApi;
