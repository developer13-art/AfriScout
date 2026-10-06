export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  DATA_ADMIN: "DATA_ADMIN",
  USER: "USER",
  API_DEVELOPER: "API_DEVELOPER",
} as const;

export type RoleKey = keyof typeof ROLES;

export const ALL_ROLES: RoleKey[] = [
  ROLES.SUPER_ADMIN,
  ROLES.DATA_ADMIN,
  ROLES.USER,
  ROLES.API_DEVELOPER,
];

export const ADMIN_ROLES: RoleKey[] = [ROLES.SUPER_ADMIN, ROLES.DATA_ADMIN];

export const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super Admin",
  DATA_ADMIN: "Data / Operations Admin",
  USER: "Business / User",
  API_DEVELOPER: "API Developer",
};

export function isAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role as RoleKey);
}

export function isSuperAdminRole(role: string | null | undefined): boolean {
  return role === ROLES.SUPER_ADMIN;
}