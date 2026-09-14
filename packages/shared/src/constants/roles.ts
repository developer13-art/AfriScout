export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  DATA_ADMIN: "DATA_ADMIN",
  USER: "USER",
  API_DEVELOPER: "API_DEVELOPER",
} as const;

export type RoleKey = keyof typeof ROLES;

export const ALL_ROLES: RoleKey[] = Object.values(ROLES);

export const ADMIN_ROLES: RoleKey[] = [ROLES.SUPER_ADMIN, ROLES.DATA_ADMIN];

export const ROLE_LABELS: Record<RoleKey, string> = {
  SUPER_ADMIN: "Super Admin",
  DATA_ADMIN: "Data / Operations Admin",
  USER: "Business / User",
  API_DEVELOPER: "API Developer",
};