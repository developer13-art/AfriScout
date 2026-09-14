import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export async function recordSubmission(input: {
  userId: string;
  itemId: string;
  submissionReference?: string;
  submittedAt?: Date;
}) {
  const item = await prisma.pipelineItem.findFirst({
    where: { id: input.itemId, pipeline: { userId: input.userId } },
  });
  if (!item) throw new NotFoundError("Pipeline item not found");

  const updated = await prisma.pipelineItem.update({
    where: { id: item.id },
    data: {
      stage: "SUBMITTED",
      submissionReference: input.submissionReference ?? item.submissionReference,
      submissionDate: input.submittedAt ?? new Date(),
    },
  });

  await prisma.pipelineEvent.create({
    data: {
      pipelineItemId: item.id,
      type: "SUBMISSION_RECORDED",
      actorUserId: input.userId,
      data: { submissionReference: input.submissionReference ?? null },
    },
  });

  return updated;
}