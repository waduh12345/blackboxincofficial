import { apiSecondSlice } from "../base-query";

interface LoginRequest {
  email?: string;
  password?: string;
}
interface LoginResponseData {
  token: string;
  code_client: string;
}
interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginResponseData;
}
interface LogoutResponse {
  success: boolean;
  message: string;
}

export const authSecondApi = apiSecondSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔑 Auth Login (Murni API call saja)
    authLogin: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),

    // 🚪 Auth Logout (Bisa biarkan onQueryStarted disini karena logout biasanya tidak se-kritis login redirectnya)
    authLogout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("code_client");
          }
        } catch (err) {
          console.error(err);
        }
      },
    }),
  }),
});

export const { useAuthLoginMutation, useAuthLogoutMutation } = authSecondApi;