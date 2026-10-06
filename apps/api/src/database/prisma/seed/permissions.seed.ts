import type { PrismaClient } from "@prisma/client";
import {
  PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  ROLE_PERMISSIONS,
  type PermissionKey,
} from "../../../constants/permissions";
import { ALL_ROLES } from "../../../constants/roles";
import { logger } from "../../../config/logger";

export async function seedPermissions(prisma: PrismaClient): Promise<void> {
  const keys = Object.values(PERMISSIONS) as PermissionKey[];

  for (const key of keys) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: PERMISSION_DESCRIPTIONS[key] },
      create: { key, description: PERMISSION_DESCRIPTIONS[key] },
    });
  }

  for (const role of ALL_ROLES) {
    const permissions = ROLE_PERMISSIONS[role];
    for (const permissionKey of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { key: permissionKey },
      });
      if (!permission) continue;
      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: {
            role,
            permissionId: permission.id,
          },
        },
        update: {},
        create: { role, permissionId: permission.id },
      });
    }
  }

  logger.info(
    { permissions: keys.length, roles: ALL_ROLES.length },
    "permissions_seeded",
  );
}