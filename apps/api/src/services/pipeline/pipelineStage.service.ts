import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";
import type { PipelineStage } from "@prisma/client";

export async function moveStage(input: {
  userId: string;
  itemId: string;
  stage: PipelineStage;
  submissionReference?: string;
  notes?: string;
}) {
  const item = await prisma.pipelineItem.findFirst({
    where: { id: input.itemId, pipeline: { userId: input.userId } },
  });
  if (!item) throw new NotFoundError("Pipeline item not found");

  const updated = await prisma.pipelineItem.update({
    where: { id: item.id },
    data: {
      stage: input.stage,
      submissionReference: input.submissionReference ?? item.submissionReference,
      notes: input.notes ?? item.notes,
      submissionDate:
        input.stage === "SUBMITTED" ? new Date() : item.submissionDate,
    },
  });

  await prisma.pipelineEvent.create({
    data: {
      pipelineItemId: item.id,
      type: "STAGE_CHANGED",
      fromStage: item.stage,
      toStage: input.stage,
      actorUserId: input.userId,
      data: input.submissionReference
        ? { submissionReference: input.submissionReference }
        : undefined,
    },
  });

  return updated;
}