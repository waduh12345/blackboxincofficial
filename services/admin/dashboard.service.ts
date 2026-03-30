import { apiSlice } from "../base-query";
import {
  DashboardData,
  DashboardParams,
  DashboardApiResponse,
} from "@/types/admin/dashboard";

export const dashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardData, DashboardParams>({
      query: ({ range = "today" } = {}) => ({
        url: `/dashboard`,
        method: "GET",
        params: { range },
      }),
      transformResponse: (response: DashboardApiResponse) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardQuery } = dashboardApi;
