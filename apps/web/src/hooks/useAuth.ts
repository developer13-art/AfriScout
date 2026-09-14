import { useCallback, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { authService } from "../services/auth.service";
import { useUserStore } from "../stores/userStore";

export function useAuth() {
  const { user, accessToken, loading, setUser, setTokens, setLoading, clear } =
    useAuthStore();
  const resetUser = useUserStore((s) => s.reset);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clear();
          resetUser();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [accessToken, clear, resetUser, setLoading, setUser]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login({ email, password });
      setTokens(result.accessToken, result.refreshToken);
      setUser(result.user);
      return result.user;
    },
    [setTokens, setUser],
  );

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors on logout
    }
    clear();
    resetUser();
  }, [clear, resetUser]);

  return { user, loading, signIn, signOut };
}