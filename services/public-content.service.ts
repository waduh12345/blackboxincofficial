import { apiSlice } from "./base-query";
import type { ContentItem, ContentSection } from "@/types/admin/content";

export const publicContentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Ambil konten aktif berdasarkan section (untuk halaman publik)
    getPublicContentBySection: builder.query<ContentItem[], ContentSection>({
      query: (section) => ({
        url: `/public/contents`,
        method: "GET",
        params: { section, is_active: true },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ContentItem[] | { data: ContentItem[] };
      }) => {
        const d = response.data;
        return Array.isArray(d) ? d : d.data;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({
                type: "Content" as const,
                id: item.id,
              })),
              { type: "Content" as const, id: "LIST" },
            ]
          : [{ type: "Content" as const, id: "LIST" }],
    }),

    // Ambil semua konten aktif untuk home page (semua section sekaligus)
    getHomeContents: builder.query<ContentItem[], void>({
      query: () => ({
        url: `/public/contents`,
        method: "GET",
        params: { is_active: true, paginate: 100 },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ContentItem[] | { data: ContentItem[] };
      }) => {
        const d = response.data;
        return Array.isArray(d) ? d : d.data;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((item) => ({
                type: "Content" as const,
                id: item.id,
              })),
              { type: "Content" as const, id: "LIST" },
            ]
          : [{ type: "Content" as const, id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPublicContentBySectionQuery,
  useGetHomeContentsQuery,
} = publicContentApi;
