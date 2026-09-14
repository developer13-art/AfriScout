import { useMemo } from "react";
import { useRole } from "./useRole";
import { hasRole, isAdmin, isAtLeast, isSuperAdmin } from "../utils/permissions";
import type { UserRole } from "../types/user";

export function usePermissions() {
  const { role } = useRole();

  return useMemo(
    () => ({
      hasRole: (required: UserRole | UserRole[]) => hasRole(role, required),
      isAdmin: isAdmin(role),
      isSuperAdmin: isSuperAdmin(role),
      isAtLeast: (minimum: UserRole) => isAtLeast(role, minimum),
    }),
    [role],
  );
}