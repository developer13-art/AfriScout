import { prisma } from "../../config/database";
import { logger } from "../../config/logger";

export async function expireOpportunities(): Promise<number> {
  const now = new Date();
  const stale = await prisma.opportunity.findMany({
    where: {
      deadline: { lt: now },
      status: { not: "ARCHIVED" },
      systemState: { not: "EXPIRED" },
    },
    select: { id: true },
    take: 500,
  });

  if (stale.length === 0) return 0;

  const ids = stale.map((s) => s.id);
  await prisma.opportunity.updateMany({
    where: { id: { in: ids } },
    data: {
      systemState: "EXPIRED",
      status: "CLOSED",
    },
  });

  logger.info({ count: ids.length }, "opportunities_expired");
  return ids.length;
}