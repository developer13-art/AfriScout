import type { PrismaClient } from "@prisma/client";
import { env } from "../../../config/env";
import { hashPassword } from "../../../services/auth/password.service";
import { logger } from "../../../config/logger";

export async function seedSuperAdmin(prisma: PrismaClient): Promise<void> {
  const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    logger.info({ email }, "super_admin_exists");
    return;
  }

  const passwordHash = await hashPassword(env.SUPER_ADMIN_PASSWORD);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: env.SUPER_ADMIN_FULL_NAME,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  logger.info({ email }, "super_admin_created");
}