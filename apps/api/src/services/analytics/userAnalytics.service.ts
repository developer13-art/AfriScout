import { prisma } from "../../config/database";

export async function userAnalytics(userId: string) {
  const [savedCount, watchlistCount, pipelineCount, byStage] = await Promise.all([
    prisma.savedOpportunity.count({ where: { userId } }),
    prisma.watchlist.count({ where: { userId } }),
    prisma.pipelineItem.count({ where: { pipeline: { userId } } }),
    prisma.pipelineItem.groupBy({
      by: ["stage"],
      where: { pipeline: { userId } },
      _count: { _all: true },
    }),
  ]);

  const stageMap: Record<string, number> = {};
  for (const entry of byStage) stageMap[entry.stage] = entry._count._all;

  const submitted = (stageMap.SUBMITTED ?? 0) + (stageMap.UNDER_REVIEW ?? 0) + (stageMap.WON ?? 0) + (stageMap.LOST ?? 0);
  const wins = stageMap.WON ?? 0;
  const losses = stageMap.LOST ?? 0;
  const winRate = submitted === 0 ? 0 : wins / (wins + losses || 1);

  return {
    savedCount,
    watchlistCount,
    pipelineCount,
    applicationsSubmitted: submitted,
    wins,
    losses,
    winRate,
    byStage: byStage.map((entry) => ({ stage: entry.stage, count: entry._count._all })),
  };
}