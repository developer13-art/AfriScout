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

const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

const USER_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.OPPORTUNITIES_READ,
  PERMISSIONS.SOURCES_READ,
  PERMISSIONS.API_KEYS_READ,
  PERMISSIONS.API_KEYS_WRITE,
  PERMISSIONS.WEBHOOKS_READ,
  PERMISSIONS.WEBHOOKS_WRITE,
];

const DATA_ADMIN_PERMISSIONS: PermissionKey[] = [
  ...USER_PERMISSIONS,
  PERMISSIONS.SOURCES_WRITE,
  PERMISSIONS.SOURCES_ACTIVATE,
  PERMISSIONS.ACTOR_RUNS_READ,
  PERMISSIONS.ACTOR_RUNS_TRIGGER,
  PERMISSIONS.OPPORTUNITIES_WRITE,
  PERMISSIONS.OPPORTUNITIES_VERIFY,
  PERMISSIONS.DUPLICATES_REVIEW,
  PERMISSIONS.CHANGES_REVIEW,
  PERMISSIONS.AI_MONITOR,
  PERMISSIONS.SYSTEM_HEALTH_READ,
  PERMISSIONS.AUDIT_LOGS_READ,
  PERMISSIONS.SETTINGS_READ,
];

const API_DEVELOPER_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.OPPORTUNITIES_READ,
  PERMISSIONS.SOURCES_READ,
  PERMISSIONS.API_KEYS_READ,
  PERMISSIONS.API_KEYS_WRITE,
  PERMISSIONS.WEBHOOKS_READ,
  PERMISSIONS.WEBHOOKS_WRITE,
];

export const ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  SUPER_ADMIN: ALL_PERMISSIONS,
  DATA_ADMIN: DATA_ADMIN_PERMISSIONS,
  USER: USER_PERMISSIONS,
  API_DEVELOPER: API_DEVELOPER_PERMISSIONS,
};

export function roleHasPermission(
  role: RoleKey | null | undefined,
  permission: PermissionKey,
): boolean {
  if (!role) return false;
  if (role === ROLES.SUPER_ADMIN) return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const PERMISSION_DESCRIPTIONS: Record<PermissionKey, string> = {
  "users:read": "Read user accounts",
  "users:write": "Update user accounts",
  "users:delete": "Delete user accounts",
  "sources:read": "Read the source registry",
  "sources:write": "Add and edit sources",
  "sources:activate": "Activate and deactivate sources",
  "actor-runs:read": "Read actor run history",
  "actor-runs:trigger": "Trigger discovery runs",
  "opportunities:read": "Read opportunities",
  "opportunities:write": "Edit opportunities",
  "opportunities:verify": "Verify opportunities",
  "duplicates:review": "Review duplicate candidates",
  "changes:review": "Review detected changes",
  "ai:monitor": "Monitor AI usage and quality",
  "system-health:read": "Read system health",
  "audit-logs:read": "Read audit logs",
  "settings:read": "Read system settings",
  "settings:write": "Update system settings",
  "api-keys:read": "Read API keys",
  "api-keys:write": "Create and revoke API keys",
  "webhooks:read": "Read webhook endpoints",
  "webhooks:write": "Create and manage webhooks",
};