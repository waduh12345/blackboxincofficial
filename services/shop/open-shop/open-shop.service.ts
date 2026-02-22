import { apiSlice } from "@/services/base-query";
import { Shop, Region } from "@/types/shop";

export const shopApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // User-facing: create or update own shop (uses auth()->user()->shop)
    createOrUpdateShop: builder.mutation<Shop, FormData>({
      query: (payload) => ({
        url: `/shop`,
        method: "POST",
        body: payload,
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Shop;
      }) => response.data,
    }),

    // 🔍 Get Province List
    getProvinces: builder.query<Region[], void>({
      query: () => ({
        url: `/rajaongkir/province`,
        method: "GET",
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Region[];
      }) => response.data,
    }),

    // 🔍 Get City List by Province ID
    getCities: builder.query<Region[], number>({
      query: (provinceId) => ({
        url: `/rajaongkir/city`,
        method: "GET",
        params: {
          province_id: provinceId,
        },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Region[];
      }) => response.data,
    }),

    // 🔍 Get District List by City ID
    getDistricts: builder.query<Region[], number>({
      query: (cityId) => ({
        url: `/rajaongkir/district`,
        method: "GET",
        params: {
          city_id: cityId,
        },
      }),
      transformResponse: (response: {
        code: number;
        message: string;
        data: Region[];
      }) => response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateOrUpdateShopMutation,
  useGetProvincesQuery,
  useGetCitiesQuery,
  useGetDistrictsQuery,
} = shopApi;
