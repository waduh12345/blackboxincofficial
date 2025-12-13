import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  prepareHeaders: async (headers) => {
    const session = await getSession();
    if (session?.user.token) {
      headers.set("Authorization", `Bearer ${session.user.token}`);
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});

// Base Second Query (LocalStorage)
const baseSecondQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_SECOND_URL,
  prepareHeaders: (headers) => {
    let token = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem("token");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    headers.set("Accept", "application/json");
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery: baseQuery,
  tagTypes: ["ProductVariant"] as const,
  endpoints: () => ({}),
});

export const apiSecondSlice = createApi({
  reducerPath: "apiSecond",
  baseQuery: baseSecondQuery,
  tagTypes: [
    "Client",
    "Hero",
    "KategoriProduk",
    "Mengapa",
    "Produk",
    "CTA",
    "AboutUs",
    "Value",
    "Slider",
  ],
  endpoints: () => ({}),
});