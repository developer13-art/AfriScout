import { prisma } from "../../config/database";

export async function listEvents(itemId: string, limit = 100) {
  return prisma.pipelineEvent.findMany({
    where: { pipelineItemId: itemId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function recordEvent(input: {
  itemId: string;
  type:
    | "CREATED"
    | "STAGE_CHANGED"
    | "NOTE_ADDED"
    | "CHECKLIST_UPDATED"
    | "SUBMISSION_RECORDED"
    | "OUTCOME_RECORDED";
  actorUserId?: string | null;
  fromStage?: string;
  toStage?: string;
  data?: Record<string, unknown>;
}) {
  return prisma.pipelineEvent.create({
    data: {
      pipelineItemId: input.itemId,
      type: input.type,
      actorUserId: input.actorUserId ?? null,
      fromStage: (input.fromStage ?? null) as never,
      toStage: (input.toStage ?? null) as never,
      data: (input.data ?? null) as never,
    },
  });
}