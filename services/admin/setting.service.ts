import { apiSlice } from "../base-query";
import { GlobalSetting, SettingResponse } from "@/types/admin/setting";

export const settingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔍 Get Global Setting
    getSetting: builder.query<GlobalSetting, void>({
      query: () => ({
        url: `/setting`,
        method: "GET",
      }),
      transformResponse: (response: SettingResponse) => response.data,
      providesTags: ["Setting"],
    }),

    // ✏️ Update Global Setting
    updateSetting: builder.mutation<GlobalSetting, FormData>({
      query: (payload) => ({
        url: `/setting`,
        method: "POST", // Use POST with _method=PUT inside FormData or PUT depending on backend framework, assuming Laravel, POST with _method is common for FormData.
        body: payload,
      }),
      transformResponse: (response: SettingResponse) => response.data,
      invalidatesTags: ["Setting"],
    }),
  }),
  overrideExisting: false,
});

export const { useGetSettingQuery, useUpdateSettingMutation } = settingApi;
