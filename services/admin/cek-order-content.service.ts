import { apiSlice } from "../base-query";
import type {
  CekOrderContent,
  CekOrderContentResponse,
} from "@/types/admin/cek-order-content";

export const cekOrderContentAdminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCekOrderContent: builder.query<CekOrderContent, void>({
      query: () => ({
        url: `/web/cek-order-content`,
        method: "GET",
      }),
      transformResponse: (res: CekOrderContentResponse) => res.data,
      providesTags: [{ type: "CekOrderContent", id: "SINGLETON" }],
    }),

    // payload bisa berupa FormData (multipart) atau JSON object.
    // Backend menerima salah satu — gunakan FormData jika ada upload.
    updateCekOrderContent: builder.mutation<
      CekOrderContent,
      FormData | Partial<CekOrderContent>
    >({
      query: (payload) => ({
        url: `/web/cek-order-content?_method=PUT`,
        method: "POST",
        body: payload,
        // Jika payload adalah plain object kirim sebagai JSON
        ...(payload instanceof FormData
          ? {}
          : { headers: { "Content-Type": "application/json" } }),
      }),
      transformResponse: (res: CekOrderContentResponse) => res.data,
      invalidatesTags: [{ type: "CekOrderContent", id: "SINGLETON" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCekOrderContentQuery,
  useUpdateCekOrderContentMutation,
} = cekOrderContentAdminApi;
