import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";
import type { OutcomeType, PipelineStage } from "@prisma/client";

const stageMap: Record<OutcomeType, PipelineStage> = {
  WON: "WON",
  LOST: "LOST",
  WITHDRAWN: "WITHDRAWN",
  DISQUALIFIED: "DISQUALIFIED",
  EXPIRED: "EXPIRED",
  PENDING: "UNDER_REVIEW",
};

export async function recordOutcome(input: {
  userId: string;
  itemId: string;
  outcomeType: OutcomeType;
  outcomeValue?: number | null;
  outcomeCurrency?: string | null;
  outcomeDate?: Date | null;
}) {
  const item = await prisma.pipelineItem.findFirst({
    where: { id: input.itemId, pipeline: { userId: input.userId } },
  });
  if (!item) throw new NotFoundError("Pipeline item not found");

  const updated = await prisma.pipelineItem.update({
    where: { id: item.id },
    data: {
      stage: stageMap[input.outcomeType],
      outcomeType: input.outcomeType,
      outcomeValue: input.outcomeValue ?? null,
      outcomeCurrency: input.outcomeCurrency ?? null,
      outcomeDate: input.outcomeDate ?? new Date(),
    },
  });

  await prisma.pipelineEvent.create({
    data: {
      pipelineItemId: item.id,
      type: "OUTCOME_RECORDED",
      actorUserId: input.userId,
      data: {
        outcomeType: input.outcomeType,
        outcomeValue: input.outcomeValue ?? null,
        outcomeCurrency: input.outcomeCurrency ?? null,
      },
    },
  });

  return updated;
}