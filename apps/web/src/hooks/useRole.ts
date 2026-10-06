import { useAuthStore } from "../stores/authStore";

export function useRole() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? null;
  return {
    role,
    isAuthenticated: Boolean(user),
    isAdmin: role === "SUPER_ADMIN" || role === "DATA_ADMIN",
    isSuperAdmin: role === "SUPER_ADMIN",
    isDeveloper: role === "API_DEVELOPER",
  };
}