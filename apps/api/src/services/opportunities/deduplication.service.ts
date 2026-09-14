import { prisma } from "../../config/database";
import { normalizeWhitespace } from "../../utils/string";
import { computeTitleSimilarity } from "./similarity.service";

export interface DeduplicationResult {
  duplicate: boolean;
  canonicalId: string | null;
  similarity: number;
  signals: Record<string, unknown>;
}

export async function findPotentialDuplicate(
  opportunity: {
    title: string;
    organizationName?: string | null;
    deadline?: string | null;
    countryCode?: string | null;
    sourceUrl: string;
  },
): Promise<DeduplicationResult> {
  const normalizedTitle = normalizeWhitespace(opportunity.title).toLowerCase();

  const candidates = await prisma.opportunity.findMany({
    where: {
      OR: [
        { title: { contains: opportunity.title.slice(0, 40), mode: "insensitive" } },
        { organizationName: opportunity.organizationName ?? undefined },
      ],
    },
    take: 20,
    select: {
      id: true,
      title: true,
      organizationName: true,
      deadline: true,
      countryCode: true,
      sources: { select: { sourceUrl: true } },
    },
  });

  for (const candidate of candidates) {
    for (const source of candidate.sources) {
      if (source.sourceUrl === opportunity.sourceUrl) {
        return {
          duplicate: true,
          canonicalId: candidate.id,
          similarity: 1,
          signals: { reason: "identical_source_url" },
        };
      }
    }
  }

  let best: { id: string; similarity: number; signals: Record<string, unknown> } | null = null;

  for (const candidate of candidates) {
    const similarity = computeTitleSimilarity(
      normalizedTitle,
      normalizeWhitespace(candidate.title).toLowerCase(),
    );
    const orgMatch =
      opportunity.organizationName && candidate.organizationName
        ? opportunity.organizationName.toLowerCase() === candidate.organizationName.toLowerCase()
        : false;
    const countryMatch =
      opportunity.countryCode && candidate.countryCode
        ? opportunity.countryCode === candidate.countryCode
        : false;

    let score = similarity;
    if (orgMatch) score = Math.min(1, score + 0.15);
    if (countryMatch) score = Math.min(1, score + 0.05);

    if (score >= 0.85 && (!best || score > best.similarity)) {
      best = {
        id: candidate.id,
        similarity: score,
        signals: { titleSimilarity: similarity, orgMatch, countryMatch },
      };
    }
  }

  if (best) {
    return {
      duplicate: true,
      canonicalId: best.id,
      similarity: best.similarity,
      signals: best.signals,
    };
  }

  return { duplicate: false, canonicalId: null, similarity: 0, signals: {} };
}

export async function recordDuplicateCandidate(input: {
  canonicalId: string;
  candidateId: string;
  similarity: number;
  signals: Record<string, unknown>;
}) {
  const existing = await prisma.opportunityDuplicate.findFirst({
    where: {
      canonicalId: input.canonicalId,
      candidateId: input.candidateId,
      status: "PENDING",
    },
  });
  if (existing) return existing;

  return prisma.opportunityDuplicate.create({
    data: {
      canonicalId: input.canonicalId,
      candidateId: input.candidateId,
      similarity: input.similarity as never,
      signals: input.signals as never,
      status: "PENDING",
    },
  });
}