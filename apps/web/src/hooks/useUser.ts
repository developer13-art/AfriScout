import { useUserStore } from "../stores/userStore";
import { useAuthStore } from "../stores/authStore";

export function useUser() {
  const user = useAuthStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const business = useUserStore((s) => s.business);
  const student = useUserStore((s) => s.student);
  return { user, profile, business, student };
}