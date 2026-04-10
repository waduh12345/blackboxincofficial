import { apiSlice } from "../base-query";
import type {
  ContentItem,
  ContentListParams,
  ContentListResponse,
} from "@/types/admin/content";

export const contentAdminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // List konten (dengan filter section & pagination)
    getContentList: builder.query<ContentListResponse, ContentListParams>({
      query: (params) => ({
        url: `/web/contents`,
        method: "GET",
        params,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: {
          current_page: number;
          data: ContentItem[];
          last_page: number;
          total: number;
          per_page: number;
        };
      }) => ({
        data: response.data.data,
        last_page: response.data.last_page,
        current_page: response.data.current_page,
        total: response.data.total,
        per_page: response.data.per_page,
      }),
    }),

    // Detail konten by ID
    getContentById: builder.query<ContentItem, number>({
      query: (id) => ({
        url: `/web/contents/${id}`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ContentItem;
      }) => response.data,
    }),

    // Create konten baru
    createContent: builder.mutation<ContentItem, FormData>({
      query: (payload) => ({
        url: `/web/contents`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ContentItem;
      }) => response.data,
    }),

    // Update konten by ID
    updateContent: builder.mutation<
      ContentItem,
      { id: number; payload: FormData }
    >({
      query: ({ id, payload }) => ({
        url: `/web/contents/${id}?_method=PUT`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: ContentItem;
      }) => response.data,
    }),

    // Delete konten by ID
    deleteContent: builder.mutation<{ code: number; message: string }, number>({
      query: (id) => ({
        url: `/web/contents/${id}`,
        method: "DELETE",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetContentListQuery,
  useGetContentByIdQuery,
  useCreateContentMutation,
  useUpdateContentMutation,
  useDeleteContentMutation,
} = contentAdminApi;
