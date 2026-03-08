// File Manager - auth.ts

import api from "./client";

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserOut {
  id: number;
  email: string;
  created_at: string;
}

export const authApi = {
  register: (payload: RegisterPayload): Promise<UserOut> =>
    api.post<UserOut>("/auth/register", payload).then((r) => r.data),

  login: (payload: LoginPayload): Promise<TokenResponse> =>
    api.post<TokenResponse>("/auth/login", payload).then((r) => r.data),
};