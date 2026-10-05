import { prisma } from "../../config/database";
import { hashObject } from "../../utils/hash";

export async function createVersion(input: {
  opportunityId: string;
  snapshot: Record<string, unknown>;
  createdByRunId?: string | null;
}) {
  const latest = await prisma.opportunityVersion.findFirst({
    where: { opportunityId: input.opportunityId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latest?.version ?? 0) + 1;

  return prisma.opportunityVersion.create({
    data: {
      opportunityId: input.opportunityId,
      version,
      snapshot: input.snapshot as never,
      snapshotHash: hashObject(input.snapshot),
      createdByRunId: input.createdByRunId ?? null,
    },
  });
}

export async function listVersions(opportunityId: string) {
  return prisma.opportunityVersion.findMany({
    where: { opportunityId },
    orderBy: { version: "desc" },
  });
}