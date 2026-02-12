import { apiSecondSlice } from "../base-query";

// ==========================================
// 1. Type Definitions
// ==========================================

// Tipe data Client sesuai response JSON
export interface Client {
  id: number;
  name: string;
  url_website: string;
  pic: string;
  email: string;
  phone_number: string;
  address: string;
  status: number;
  code: string;
  status_desc: string;
}

// Payload untuk Create/Update (biasanya tanpa ID dan status_desc)
export interface ClientRequest {
  name: string;
  url_website: string;
  pic: string;
  email: string;
  phone_number: string;
  address: string;
  status: number;
  code?: string; // Opsional jika auto-generated
}

// Parameter untuk Get All (Pagination & Search)
export interface ClientListParams {
  page?: number;
  paginate?: number;
  search?: string;
}

// --- Response Types ---

// Response Get All
export interface ClientListResponse {
  success: boolean;
  message: string;
  data: {
    items: Client[];
    total: number;
    pageTotal: number;
    currentPage: number;
  };
}

// Response Single Data (Get By ID, Create, Update)
export interface ClientDetailResponse {
  success: boolean;
  message: string;
  data: Client;
}

// Response Delete
export interface ClientDeleteResponse {
  success: boolean;
  message: string;
}

// ==========================================
// 2. Service Injection
// ==========================================

export const clientApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 📋 Get All Clients
    getClientList: builder.query<ClientListResponse, ClientListParams | void>({
      query: (params) => ({
        url: "/client",
        method: "GET",
        params: params || {}, // Kirim params query string (page, search, dll)
      }),
      // Tag untuk cache invalidation
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({
                type: "Client" as const,
                id,
              })),
              { type: "Client", id: "LIST" },
            ]
          : [{ type: "Client", id: "LIST" }],
    }),

    // 🔍 Get Client By ID
    getClientDetail: builder.query<ClientDetailResponse, number | string>({
      query: (id) => ({
        url: `/client/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "Client", id }],
    }),

    // ➕ Create Client
    createClient: builder.mutation<ClientDetailResponse, ClientRequest>({
      query: (payload) => ({
        url: "/client",
        method: "POST",
        body: payload,
      }),
      // Refresh list setelah create berhasil
      invalidatesTags: [{ type: "Client", id: "LIST" }],
    }),

    // ✏️ Update Client
    updateClient: builder.mutation<
      ClientDetailResponse,
      { id: number | string; data: ClientRequest }
    >({
      query: ({ id, data }) => ({
        url: `/client/${id}`,
        method: "PUT", // Atau PATCH tergantung backend
        body: data,
      }),
      // Refresh list dan item spesifik setelah update
      invalidatesTags: (result, error, { id }) => [
        { type: "Client", id: "LIST" },
        { type: "Client", id },
      ],
    }),

    // 🗑️ Delete Client
    deleteClient: builder.mutation<ClientDeleteResponse, number | string>({
      query: (id) => ({
        url: `/client/${id}`,
        method: "DELETE",
      }),
      // Refresh list setelah delete
      invalidatesTags: [{ type: "Client", id: "LIST" }],
    }),
  }),
});

// ==========================================
// 3. Hooks Export
// ==========================================

export const {
  useGetClientListQuery,
  useGetClientDetailQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;