import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export async function getSetting(key: string) {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) throw new NotFoundError(`Setting ${key} not found`);
  return setting;
}

export async function listSettings() {
  return prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
}

export async function upsertSetting(input: {
  key: string;
  value: unknown;
  description?: string;
  updatedBy?: string;
}) {
  return prisma.systemSetting.upsert({
    where: { key: input.key },
    update: {
      value: input.value as never,
      description: input.description,
      updatedBy: input.updatedBy ?? null,
    },
    create: {
      key: input.key,
      value: input.value as never,
      description: input.description ?? null,
      updatedBy: input.updatedBy ?? null,
    },
  });
}

export async function listFeatureFlags() {
  return prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
}

export async function setFeatureFlag(input: {
  key: string;
  enabled: boolean;
  description?: string;
  updatedBy?: string;
}) {
  return prisma.featureFlag.upsert({
    where: { key: input.key },
    update: { enabled: input.enabled, updatedBy: input.updatedBy ?? null },
    create: {
      key: input.key,
      enabled: input.enabled,
      description: input.description ?? null,
      updatedBy: input.updatedBy ?? null,
    },
  });
}