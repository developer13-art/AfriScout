import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export async function addNote(userId: string, itemId: string, body: string) {
  const item = await prisma.pipelineItem.findFirst({
    where: { id: itemId, pipeline: { userId } },
  });
  if (!item) throw new NotFoundError("Pipeline item not found");

  const note = await prisma.pipelineNote.create({
    data: {
      pipelineItemId: item.id,
      authorUserId: userId,
      body,
    },
  });

  await prisma.pipelineEvent.create({
    data: {
      pipelineItemId: item.id,
      type: "NOTE_ADDED",
      actorUserId: userId,
    },
  });

  return note;
}

export async function listNotes(itemId: string) {
  return prisma.pipelineNote.findMany({
    where: { pipelineItemId: itemId },
    orderBy: { createdAt: "desc" },
  });
}