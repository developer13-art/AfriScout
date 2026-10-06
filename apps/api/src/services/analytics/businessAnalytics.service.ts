import { prisma } from "../../config/database";
import { userAnalytics } from "./userAnalytics.service";

export async function businessAnalytics(userId: string) {
  const base = await userAnalytics(userId);
  const items = await prisma.pipelineItem.findMany({
    where: { pipeline: { userId } },
    select: {
      stage: true,
      outcomeValue: true,
      outcomeCurrency: true,
    },
  });

  let estimatedValue = 0;
  let wonValue = 0;
  let currency = "USD";

  for (const item of items) {
    const value = item.outcomeValue ? Number(item.outcomeValue) : 0;
    if (item.outcomeCurrency) currency = item.outcomeCurrency;
    if (item.stage === "SUBMITTED" || item.stage === "UNDER_REVIEW" || item.stage === "WON") {
      estimatedValue += value;
    }
    if (item.stage === "WON") wonValue += value;
  }

  return {
    ...base,
    estimatedOpportunityValue: estimatedValue,
    wonOpportunityValue: wonValue,
    currency,
  };
}