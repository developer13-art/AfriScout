import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";
import type {
  SourceSuggestionCreateInput,
  SourceSuggestionReviewInput,
} from "../../validators/source.validator";

export async function listSuggestions() {
  return prisma.sourceSuggestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createSuggestion(
  input: SourceSuggestionCreateInput,
  suggestedBy: string | null,
) {
  return prisma.sourceSuggestion.create({
    data: {
      name: input.name,
      url: input.url,
      countryCode: input.countryCode ?? null,
      category: input.category ?? null,
      notes: input.notes ?? null,
      suggestedBy,
    },
  });
}

export async function reviewSuggestion(
  id: string,
  input: SourceSuggestionReviewInput,
  reviewedBy: string,
) {
  const existing = await prisma.sourceSuggestion.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Suggestion not found");

  return prisma.sourceSuggestion.update({
    where: { id },
    data: {
      status: input.status,
      reviewNotes: input.reviewNotes ?? null,
      reviewedBy,
      reviewedAt: new Date(),
    },
  });
}