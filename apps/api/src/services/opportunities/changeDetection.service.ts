import { prisma } from "../../config/database";
import { hashObject } from "../../utils/hash";
import { logger } from "../../config/logger";

const TRACKED_FIELDS = [
  "title",
  "deadline",
  "requirements",
  "documents",
  "description",
  "valueMin",
  "valueMax",
  "eligibility",
  "city",
  "applicationUrl",
  "referenceNumber",
] as const;

type TrackedField = (typeof TRACKED_FIELDS)[number];

export interface FieldChange {
  field: TrackedField;
  oldValue: unknown;
  newValue: unknown;
}

export async function detectAndRecordChanges(
  opportunityId: string,
  previousSnapshot: Record<string, unknown>,
  nextSnapshot: Record<string, unknown>,
): Promise<FieldChange[]> {
  const changes: FieldChange[] = [];

  for (const field of TRACKED_FIELDS) {
    const before = previousSnapshot[field];
    const after = nextSnapshot[field];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changes.push({ field, oldValue: before ?? null, newValue: after ?? null });
    }
  }

  if (changes.length === 0) return changes;

  for (const change of changes) {
    await prisma.opportunityChange.create({
      data: {
        opportunityId,
        field: change.field,
        oldValue: change.oldValue as never,
        newValue: change.newValue as never,
        severity: severityFor(change.field),
      },
    });
  }

  logger.info({ opportunityId, count: changes.length }, "opportunity_changes_recorded");
  return changes;
}

function severityFor(field: TrackedField): "NORMAL" | "IMPORTANT" | "CRITICAL" {
  switch (field) {
    case "deadline":
    case "applicationUrl":
    case "referenceNumber":
      return "CRITICAL";
    case "requirements":
    case "eligibility":
    case "documents":
      return "IMPORTANT";
    default:
      return "NORMAL";
  }
}

export async function snapshotOpportunity(opportunityId: string): Promise<Record<string, unknown>> {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: {
      title: true,
      deadline: true,
      requirements: true,
      description: true,
      valueMin: true,
      valueMax: true,
      eligibility: true,
      city: true,
      applicationUrl: true,
      referenceNumber: true,
      documents: { select: { url: true } },
    },
  });
  if (!opportunity) return {};
  return {
    ...opportunity,
    documents: opportunity.documents.map((doc) => doc.url),
  };
}

export function snapshotHash(snapshot: Record<string, unknown>): string {
  return hashObject(snapshot);
}