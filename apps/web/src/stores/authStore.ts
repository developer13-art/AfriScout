import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types/user";
import { LOCAL_STORAGE_KEYS } from "../utils/constants";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (access: string | null, refresh: string | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: true,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setLoading: (loading) => set({ loading }),
      clear: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          loading: false,
        }),
    }),
    {
      name: LOCAL_STORAGE_KEYS.authToken,
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);