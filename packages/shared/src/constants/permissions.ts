import { ROLES, type RoleKey } from "./roles";

export const PERMISSIONS = {
  USERS_READ: "users:read",
  USERS_WRITE: "users:write",
  USERS_DELETE: "users:delete",
  SOURCES_READ: "sources:read",
  SOURCES_WRITE: "sources:write",
  SOURCES_ACTIVATE: "sources:activate",
  ACTOR_RUNS_READ: "actor-runs:read",
  ACTOR_RUNS_TRIGGER: "actor-runs:trigger",
  OPPORTUNITIES_READ: "opportunities:read",
  OPPORTUNITIES_WRITE: "opportunities:write",
  OPPORTUNITIES_VERIFY: "opportunities:verify",
  DUPLICATES_REVIEW: "duplicates:review",
  CHANGES_REVIEW: "changes:review",
  AI_MONITOR: "ai:monitor",
  SYSTEM_HEALTH_READ: "system-health:read",
  AUDIT_LOGS_READ: "audit-logs:read",
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",
  API_KEYS_READ: "api-keys:read",
  API_KEYS_WRITE: "api-keys:write",
  WEBHOOKS_READ: "webhooks:read",
  WEBHOOKS_WRITE: "webhooks:write",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  DATA_ADMIN: [
    PERMISSIONS.OPPORTUNITIES_READ,
    PERMISSIONS.OPPORTUNITIES_WRITE,
    PERMISSIONS.OPPORTUNITIES_VERIFY,
    PERMISSIONS.SOURCES_READ,
    PERMISSIONS.SOURCES_WRITE,
    PERMISSIONS.SOURCES_ACTIVATE,
    PERMISSIONS.ACTOR_RUNS_READ,
    PERMISSIONS.ACTOR_RUNS_TRIGGER,
    PERMISSIONS.DUPLICATES_REVIEW,
    PERMISSIONS.CHANGES_REVIEW,
    PERMISSIONS.AI_MONITOR,
    PERMISSIONS.SYSTEM_HEALTH_READ,
    PERMISSIONS.AUDIT_LOGS_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_WRITE,
  ],
  USER: [
    PERMISSIONS.OPPORTUNITIES_READ,
    PERMISSIONS.SOURCES_READ,
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_WRITE,
    PERMISSIONS.WEBHOOKS_READ,
    PERMISSIONS.WEBHOOKS_WRITE,
  ],
  API_DEVELOPER: [
    PERMISSIONS.OPPORTUNITIES_READ,
    PERMISSIONS.SOURCES_READ,
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_WRITE,
    PERMISSIONS.WEBHOOKS_READ,
    PERMISSIONS.WEBHOOKS_WRITE,
  ],
};

export function roleHasPermission(
  role: RoleKey | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!role) return false;
  if (role === ROLES.SUPER_ADMIN) return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}