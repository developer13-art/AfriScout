import { prisma } from "../../config/database";
import { hashObject } from "../../utils/hash";
import { slugify, ensureUniqueSlug } from "../../utils/slugify";
import type { NormalizedOpportunity } from "../../types/opportunity";

export async function createVersion(input: {
  opportunityId: string;
  snapshot: Record<string, unknown>;
  createdByRunId?: string | null;
}) {
  const latest = await prisma.opportunityVersion.findFirst({
    where: { opportunityId: input.opportunityId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latest?.version ?? 0) + 1;

  return prisma.opportunityVersion.create({
    data: {
      opportunityId: input.opportunityId,
      version,
      snapshot: input.snapshot as never,
      snapshotHash: hashObject(input.snapshot),
      createdByRunId: input.createdByRunId ?? null,
    },
  });
}

export async function listVersions(opportunityId: string) {
  return prisma.opportunityVersion.findMany({
    where: { opportunityId },
    orderBy: { version: "desc" },
  });
}

export async function upsertCanonicalOpportunity(
  normalized: NormalizedOpportunity,
  sourceId: string,
  rawOpportunityId: string | null,
  sourceRunId: string | null,
) {
  // First, check whether an opportunity already has a source link with this exact URL.
  const existingLink = await prisma.opportunitySource.findFirst({
    where: { sourceUrl: normalized.sourceUrl },
    select: { opportunityId: true },
  });

  if (existingLink) {
    await prisma.opportunitySource.upsert({
      where: {
        opportunityId_sourceId_sourceUrl: {
          opportunityId: existingLink.opportunityId,
          sourceId,
          sourceUrl: normalized.sourceUrl,
        },
      },
      update: { lastSeenAt: new Date() },
      create: {
        opportunityId: existingLink.opportunityId,
        sourceId,
        rawOpportunityId,
        sourceUrl: normalized.sourceUrl,
        sourceTitle: normalized.title,
        publishedAt: normalized.publishedAt ? new Date(normalized.publishedAt) : null,
        deadline: normalized.deadline ? new Date(normalized.deadline) : null,
      },
    });

    return prisma.opportunity.findUnique({
      where: { id: existingLink.opportunityId },
    });
  }

  // Otherwise, create a new canonical opportunity.
  const base = slugify(normalized.title);
  let slug = base;
  let suffix = 1;
  while (await prisma.opportunity.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = ensureUniqueSlug(base, suffix);
    if (suffix > 500) break;
  }

  const created = await prisma.opportunity.create({
    data: {
      title: normalized.title,
      slug,
      organizationId: normalized.organizationId ?? null,
      organizationName: normalized.organizationName ?? null,
      category: normalized.category,
      subcategory: normalized.subcategory ?? null,
      opportunityType: normalized.opportunityType,
      countryCode: normalized.countryCode ?? null,
      region: normalized.region ?? null,
      city: normalized.city ?? null,
      locationText: normalized.locationText ?? null,
      isRemote: normalized.isRemote ?? false,
      description: normalized.description ?? null,
      summaryShort: normalized.summaryShort ?? null,
      valueMin: normalized.valueMin ?? null,
      valueMax: normalized.valueMax ?? null,
      currency: normalized.currency ?? null,
      publishedAt: normalized.publishedAt ? new Date(normalized.publishedAt) : null,
      deadline: normalized.deadline ? new Date(normalized.deadline) : null,
      eligibility: normalized.eligibility ?? null,
      requirements: normalized.requirements ?? null,
      applicationMethod: normalized.applicationMethod ?? null,
      applicationUrl: normalized.applicationUrl ?? null,
      referenceNumber: normalized.referenceNumber ?? null,
      status: "PUBLISHED",
      systemState: "PUBLISHED",
      verificationStatus: "UNVERIFIED",
      extra: (normalized.extra ?? {}) as never,
      sources: {
        create: {
          sourceId,
          rawOpportunityId,
          sourceUrl: normalized.sourceUrl,
          sourceTitle: normalized.title,
          publishedAt: normalized.publishedAt ? new Date(normalized.publishedAt) : null,
          deadline: normalized.deadline ? new Date(normalized.deadline) : null,
          isPrimary: true,
        },
      },
    },
  });

  await createVersion({
    opportunityId: created.id,
    snapshot: normalized as unknown as Record<string, unknown>,
    createdByRunId: sourceRunId,
  });

  return created;
}