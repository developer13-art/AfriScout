import { prisma } from "../../config/database";
import { ROLE_PERMISSIONS, type PermissionKey } from "../../constants/permissions";
import type { RoleKey } from "../../constants/roles";

export async function getUserPermissions(userId: string): Promise<PermissionKey[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) return [];
  return ROLE_PERMISSIONS[user.role as RoleKey] ?? [];
}

export function hasPermission(
  role: RoleKey,
  permissions: PermissionKey[],
  required: PermissionKey,
): boolean {
  if (role === "SUPER_ADMIN") return true;
  return permissions.includes(required);
}

export async function getRolePermissionMatrix() {
  const permissions = await prisma.permission.findMany({
    orderBy: { key: "asc" },
    select: { id: true, key: true, description: true },
  });
  const mapping = await prisma.rolePermission.findMany({
    select: { role: true, permissionId: true },
  });

  const byRole: Record<string, string[]> = {};
  for (const entry of mapping) {
    const permission = permissions.find((p) => p.id === entry.permissionId);
    if (!permission) continue;
    if (!byRole[entry.role]) byRole[entry.role] = [];
    byRole[entry.role]!.push(permission.key);
  }

  return { permissions, byRole };
}