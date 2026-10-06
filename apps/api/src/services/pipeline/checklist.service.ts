import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export async function upsertChecklist(
  userId: string,
  itemId: string,
  items: {
    id: string;
    label: string;
    description?: string;
    isRequired: boolean;
    completed: boolean;
    orderIndex: number;
    source: "SOURCE_FACT" | "AI_INTERPRETATION";
  }[],
) {
  const item = await prisma.pipelineItem.findFirst({
    where: { id: itemId, pipeline: { userId } },
  });
  if (!item) throw new NotFoundError("Pipeline item not found");

  let checklist = await prisma.checklist.findUnique({
    where: { pipelineItemId: item.id },
  });
  if (!checklist) {
    checklist = await prisma.checklist.create({
      data: { pipelineItemId: item.id },
    });
  }

  await prisma.checklistItem.deleteMany({ where: { checklistId: checklist.id } });

  await prisma.checklistItem.createMany({
    data: items.map((entry) => ({
      checklistId: checklist!.id,
      label: entry.label,
      description: entry.description ?? null,
      isRequired: entry.isRequired,
      completed: entry.completed,
      completedAt: entry.completed ? new Date() : null,
      orderIndex: entry.orderIndex,
      source: entry.source,
    })),
  });

  await prisma.pipelineEvent.create({
    data: {
      pipelineItemId: item.id,
      type: "CHECKLIST_UPDATED",
      actorUserId: userId,
    },
  });

  return prisma.checklistItem.findMany({
    where: { checklistId: checklist.id },
    orderBy: { orderIndex: "asc" },
  });
}

export async function getChecklist(itemId: string) {
  return prisma.checklist.findUnique({
    where: { pipelineItemId: itemId },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });
}