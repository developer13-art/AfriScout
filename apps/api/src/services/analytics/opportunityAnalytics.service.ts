import { prisma } from "../../config/database";

export async function opportunityAnalytics() {
  const now = new Date();
  const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const next7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [total, byCategory, byCountry, byType, publishedLast7Days, closingNext7Days] =
    await Promise.all([
      prisma.opportunity.count(),
      prisma.opportunity.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
      prisma.opportunity.groupBy({
        by: ["countryCode"],
        _count: { _all: true },
      }),
      prisma.opportunity.groupBy({
        by: ["opportunityType"],
        _count: { _all: true },
      }),
      prisma.opportunity.count({ where: { publishedAt: { gte: last7 } } }),
      prisma.opportunity.count({ where: { deadline: { gte: now, lte: next7 } } }),
    ]);

  return {
    total,
    byCategory: byCategory.map((c) => ({ category: c.category, count: c._count._all })),
    byCountry: byCountry
      .filter((c) => c.countryCode)
      .map((c) => ({ countryCode: c.countryCode as string, count: c._count._all })),
    byType: byType.map((t) => ({ opportunityType: t.opportunityType, count: t._count._all })),
    publishedLast7Days,
    closingNext7Days,
  };
}