import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { NotFoundError, BadRequestError } from "../utils/errors";
import { logger } from "../config/logger";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  const duplicates = await prisma.opportunityDuplicate.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const ids = duplicates.flatMap((d) => [d.canonicalId, d.candidateId]);
  const opportunities = await prisma.opportunity.findMany({
    where: { id: { in: ids } },
  });
  const map: Record<string, (typeof opportunities)[number]> = {};
  for (const o of opportunities) map[o.id] = o;

  const payload = duplicates.map((d) => ({
    id: d.id,
    canonical: map[d.canonicalId],
    candidate: map[d.candidateId],
    similarity: Number(d.similarity),
    status: d.status,
  }));

  res.json({ data: payload });
});

export const merge = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const actorUserId = req.user?.id ?? null;

  const pair = await prisma.opportunityDuplicate.findUnique({ where: { id } });
  if (!pair) throw new NotFoundError("Duplicate pair not found");
  if (pair.status === "MERGED") throw new BadRequestError("Already merged");

  const canonicalId = pair.canonicalId;
  const candidateId = pair.candidateId;

  if (canonicalId === candidateId) {
    throw new BadRequestError("Canonical and candidate are the same record");
  }

  const [canonical, candidate] = await Promise.all([
    prisma.opportunity.findUnique({ where: { id: canonicalId } }),
    prisma.opportunity.findUnique({ where: { id: candidateId } }),
  ]);
  if (!canonical) throw new NotFoundError("Canonical opportunity not found");
  if (!candidate) {
    // Candidate already gone; just mark the pair.
    await prisma.opportunityDuplicate.update({
      where: { id },
      data: {
        status: "MERGED",
        reviewedAt: new Date(),
        reviewedBy: actorUserId,
      },
    });
    res.json({ data: { merged: true, canonicalId, candidateId, candidateDeleted: false } });
    return;
  }

  await prisma.$transaction(async (tx) => {
    // 1. Reassign sources
    await tx.opportunitySource.updateMany({
      where: { opportunityId: candidateId },
      data: { opportunityId: canonicalId, isPrimary: false },
    });

    // 2. Reassign documents
    await tx.opportunityDocument.updateMany({
      where: { opportunityId: candidateId },
      data: { opportunityId: canonicalId },
    });

    // 3. Copy requirements the canonical doesn't already have (by label)
    const existing = await tx.opportunityRequirement.findMany({
      where: { opportunityId: canonicalId },
      select: { label: true },
    });
    const existingLabels = new Set(existing.map((r) => r.label.trim().toLowerCase()));
    const candidateRequirements = await tx.opportunityRequirement.findMany({
      where: { opportunityId: candidateId },
    });
    for (const req of candidateRequirements) {
      const key = req.label.trim().toLowerCase();
      if (existingLabels.has(key)) continue;
      await tx.opportunityRequirement.create({
        data: {
          opportunityId: canonicalId,
          kind: req.kind,
          label: req.label,
          description: req.description,
          isMandatory: req.isMandatory,
          source: req.source,
        },
      });
      existingLabels.add(key);
    }

    // 4. Reassign saved references — delete candidate entries where the user
    //    already saved the canonical, and reassign the rest.
    const canonicalSaved = await tx.savedOpportunity.findMany({
      where: { opportunityId: canonicalId },
      select: { userId: true },
    });
    const canonicalSavedUserIds = new Set(canonicalSaved.map((s) => s.userId));
    const candidateSaved = await tx.savedOpportunity.findMany({
      where: { opportunityId: candidateId },
    });
    for (const s of candidateSaved) {
      if (canonicalSavedUserIds.has(s.userId)) {
        await tx.savedOpportunity.delete({ where: { id: s.id } });
      } else {
        await tx.savedOpportunity.update({
          where: { id: s.id },
          data: { opportunityId: canonicalId },
        });
      }
    }

    // 5. Same for watchlists
    const canonicalWatched = await tx.watchlist.findMany({
      where: { opportunityId: canonicalId },
      select: { userId: true },
    });
    const canonicalWatchedUserIds = new Set(canonicalWatched.map((w) => w.userId));
    const candidateWatched = await tx.watchlist.findMany({
      where: { opportunityId: candidateId },
    });
    for (const w of candidateWatched) {
      if (canonicalWatchedUserIds.has(w.userId)) {
        await tx.watchlist.delete({ where: { id: w.id } });
      } else {
        await tx.watchlist.update({
          where: { id: w.id },
          data: { opportunityId: canonicalId },
        });
      }
    }

    // 6. Same for pipeline items
    const canonicalPipeline = await tx.pipelineItem.findMany({
      where: { opportunityId: canonicalId },
      select: { pipelineId: true },
    });
    const canonicalPipelineIds = new Set(canonicalPipeline.map((p) => p.pipelineId));
    const candidatePipeline = await tx.pipelineItem.findMany({
      where: { opportunityId: candidateId },
    });
    for (const p of candidatePipeline) {
      if (canonicalPipelineIds.has(p.pipelineId)) {
        // Pipeline already tracks the canonical — drop the duplicate.
        await tx.pipelineItem.delete({ where: { id: p.id } });
      } else {
        await tx.pipelineItem.update({
          where: { id: p.id },
          data: { opportunityId: canonicalId },
        });
      }
    }

    // 7. Reassign notifications
    await tx.notification.updateMany({
      where: { opportunityId: candidateId },
      data: { opportunityId: canonicalId },
    });

    // 8. Mark pair merged
    await tx.opportunityDuplicate.update({
      where: { id },
      data: {
        status: "MERGED",
        reviewedAt: new Date(),
        reviewedBy: actorUserId,
      },
    });

    // 9. Delete candidate (cascades any remaining children)
    await tx.opportunity.delete({ where: { id: candidateId } });

    // 10. Audit log
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "opportunity.merged",
        entityType: "opportunity",
        entityId: canonicalId,
        data: {
          canonicalId,
          candidateId,
          similarity: Number(pair.similarity),
        },
      },
    });
  });

  // Recompute matches for the canonical after merge
  try {
    const { recomputeMatchesForOpportunity } = await import(
      "../services/matching/batchMatch.service"
    );
    await recomputeMatchesForOpportunity(canonicalId);
  } catch (error) {
    logger.error(
      { err: error, canonicalId },
      "match_recompute_after_merge_failed",
    );
  }

  res.json({
    data: { merged: true, canonicalId, candidateId, candidateDeleted: true },
  });
});

export const separate = asyncHandler(async (req: Request, res: Response) => {
  const data = await prisma.opportunityDuplicate.update({
    where: { id: req.params.id },
    data: {
      status: "SEPARATE",
      reviewedAt: new Date(),
      reviewedBy: req.user?.id ?? null,
    },
  });
  res.json({ data });
});

export const ignore = asyncHandler(async (req: Request, res: Response) => {
  const data = await prisma.opportunityDuplicate.update({
    where: { id: req.params.id },
    data: {
      status: "IGNORED",
      reviewedAt: new Date(),
      reviewedBy: req.user?.id ?? null,
    },
  });
  res.json({ data });
});