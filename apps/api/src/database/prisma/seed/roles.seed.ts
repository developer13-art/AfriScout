import type { PrismaClient } from "@prisma/client";
import { ALL_ROLES, ROLE_LABELS, type RoleKey } from "../../../constants/roles";
import { logger } from "../../../config/logger";

export async function seedRoles(_prisma: PrismaClient): Promise<void> {
  // Roles are defined as a Postgres enum in the schema, so there are no
  // rows to create. This seed exists to record the mapping between the
  // enum values and their human-readable labels used by the UI.
  for (const role of ALL_ROLES) {
    logger.debug(
      { role, label: ROLE_LABELS[role as RoleKey] },
      "role_registered",
    );
  }
}