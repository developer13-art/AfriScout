import { prisma } from "../../config/database";
import { ConflictError, NotFoundError } from "../../utils/errors";

export async function listPipelines(userId: string) {
  let pipelines = await prisma.pipeline.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (pipelines.length === 0) {
    const created = await prisma.pipeline.create({
      data: { userId, name: "Default", isDefault: true },
    });
    pipelines = [created];
  }

  return pipelines;
}

export async function getOrCreateDefaultPipeline(userId: string) {
  let pipeline = await prisma.pipeline.findFirst({
    where: { userId, isDefault: true },
  });
  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: { userId, name: "Default", isDefault: true },
    });
  }
  return pipeline;
}

export async function listItems(userId: string, pipelineId?: string) {
  const where: Record<string, unknown> = { pipeline: { userId } };
  if (pipelineId) where.pipelineId = pipelineId;
  return prisma.pipelineItem.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getItem(userId: string, itemId: string) {
  const item = await prisma.pipelineItem.findFirst({
    where: { id: itemId, pipeline: { userId } },
    include: {
      opportunity: true,
      events: { orderBy: { createdAt: "desc" } },
      checklist: { include: { items: { orderBy: { orderIndex: "asc" } } } },
      notesList: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!item) throw new NotFoundError("Pipeline item not found");
  return item;
}

export async function addItem(input: {
  userId: string;
  opportunityId: string;
  pipelineId?: string;
  ownerUserId?: string;
}) {
  const pipeline = input.pipelineId
    ? await prisma.pipeline.findFirst({ where: { id: input.pipelineId, userId: input.userId } })
    : await getOrCreateDefaultPipeline(input.userId);

  if (!pipeline) throw new NotFoundError("Pipeline not found");

  const existing = await prisma.pipelineItem.findUnique({
    where: {
      pipelineId_opportunityId: {
        pipelineId: pipeline.id,
        opportunityId: input.opportunityId,
      },
    },
  });
  if (existing) throw new ConflictError("Opportunity is already in this pipeline");

  const created = await prisma.pipelineItem.create({
    data: {
      pipelineId: pipeline.id,
      opportunityId: input.opportunityId,
      ownerUserId: input.ownerUserId ?? input.userId,
      stage: "DISCOVERED",
    },
  });

  await prisma.pipelineEvent.create({
    data: {
      pipelineItemId: created.id,
      type: "CREATED",
      toStage: "DISCOVERED",
      actorUserId: input.userId,
    },
  });

  return created;
}