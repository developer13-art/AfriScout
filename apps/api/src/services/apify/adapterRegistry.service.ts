import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export interface AdapterInfo {
  key: string;
  label: string;
  version: string;
  description: string | null;
}

export async function listAdapters(): Promise<AdapterInfo[]> {
  const adapters = await prisma.sourceAdapter.findMany({
    orderBy: { label: "asc" },
    select: { key: true, label: true, version: true, description: true },
  });
  return adapters;
}

export async function ensureAdapterRegistered(input: {
  key: string;
  label: string;
  version?: string;
  description?: string;
}): Promise<AdapterInfo> {
  const adapter = await prisma.sourceAdapter.upsert({
    where: { key: input.key },
    update: {
      label: input.label,
      version: input.version ?? "1.0.0",
      description: input.description ?? null,
    },
    create: {
      key: input.key,
      label: input.label,
      version: input.version ?? "1.0.0",
      description: input.description ?? null,
    },
    select: { key: true, label: true, version: true, description: true },
  });
  return adapter;
}

export async function requireAdapter(key: string): Promise<AdapterInfo> {
  const adapter = await prisma.sourceAdapter.findUnique({
    where: { key },
    select: { key: true, label: true, version: true, description: true },
  });
  if (!adapter) throw new NotFoundError(`Unknown adapter: ${key}`);
  return adapter;
}