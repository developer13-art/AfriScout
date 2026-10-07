import type { UserRole } from "../types/user";

const ROLE_ORDER: Record<UserRole, number> = {
  SUPER_ADMIN: 4,
  DATA_ADMIN: 3,
  USER: 2,
  API_DEVELOPER: 1,
};

export function hasRole(
  userRole: UserRole | null | undefined,
  required: UserRole | UserRole[],
): boolean {
  if (!userRole) return false;
  const required_list = Array.isArray(required) ? required : [required];
  return required_list.includes(userRole);
}

export function isAtLeast(
  userRole: UserRole | null | undefined,
  minimum: UserRole,
): boolean {
  if (!userRole) return false;
  return ROLE_ORDER[userRole] >= ROLE_ORDER[minimum];
}

export function isAdmin(userRole: UserRole | null | undefined): boolean {
  return userRole === "SUPER_ADMIN" || userRole === "DATA_ADMIN";
}

export function isSuperAdmin(userRole: UserRole | null | undefined): boolean {
  return userRole === "SUPER_ADMIN";
}