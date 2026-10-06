import { http } from "./http";
import type { User } from "../types/user";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  countryCode?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface WalletChallenge {
  walletAddress: string;
  nonce: string;
  message: string;
  expiresAt: string;
}

export interface WalletLinkResult {
  walletLinked: true;
  user: Pick<User, "id" | "walletAddress" | "walletVerifiedAt">;
}

export const authService = {
  login: (payload: LoginPayload) =>
    http<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload), auth: false }),

  register: (payload: RegisterPayload) =>
    http<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload), auth: false }),

  logout: () => http<void>("/auth/logout", { method: "POST" }),

  me: () => http<User>("/auth/me"),

  refresh: (refreshToken: string) =>
    http<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
      auth: false,
    }),

  forgotPassword: (email: string) =>
    http<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      auth: false,
    }),

  resetPassword: (token: string, password: string) =>
    http<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
      auth: false,
    }),

  verifyEmail: (token: string) =>
    http<void>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
      auth: false,
    }),

  walletChallenge: (walletAddress: string, authenticated = false) =>
    http<WalletChallenge>("/auth/wallet/challenge", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
      auth: authenticated,
    }),

  walletVerify: (
    payload: { walletAddress: string; nonce: string; signature: string; fullName?: string },
    authenticated = false,
  ) =>
    http<AuthResponse | WalletLinkResult>("/auth/wallet/verify", {
      method: "POST",
      body: JSON.stringify(payload),
      auth: authenticated,
    }),
};