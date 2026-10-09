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
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: existingLink.opportunityId },
    });
    if (opportunity) {
      const existingExtra =
        opportunity.extra && typeof opportunity.extra === "object" && !Array.isArray(opportunity.extra)
          ? (opportunity.extra as Record<string, unknown>)
          : {};
      const incomingExtra = (normalized.extra ?? {}) as Record<string, unknown>;
      const updateData = {
        title: normalized.title || opportunity.title,
        organizationId: normalized.organizationId ?? opportunity.organizationId,
        organizationName: normalized.organizationName ?? opportunity.organizationName,
        category:
          normalized.category === "OTHER" ? opportunity.category : normalized.category,
        subcategory: normalized.subcategory ?? opportunity.subcategory,
        opportunityType: normalized.opportunityType,
        countryCode: normalized.countryCode ?? opportunity.countryCode,
        region: normalized.region ?? opportunity.region,
        city: normalized.city ?? opportunity.city,
        locationText: normalized.locationText ?? opportunity.locationText,
        isRemote: normalized.isRemote || opportunity.isRemote,
        description: normalized.description ?? opportunity.description,
        summaryShort: normalized.summaryShort ?? opportunity.summaryShort,
        valueMin: normalized.valueMin ?? opportunity.valueMin,
        valueMax: normalized.valueMax ?? opportunity.valueMax,
        currency: normalized.currency ?? opportunity.currency,
        publishedAt: normalized.publishedAt
          ? new Date(normalized.publishedAt)
          : opportunity.publishedAt,
        deadline: normalized.deadline ? new Date(normalized.deadline) : opportunity.deadline,
        eligibility: normalized.eligibility ?? opportunity.eligibility,
        requirements: normalized.requirements ?? opportunity.requirements,
        applicationMethod: normalized.applicationMethod ?? opportunity.applicationMethod,
        applicationUrl: normalized.applicationUrl ?? opportunity.applicationUrl,
        referenceNumber: normalized.referenceNumber ?? opportunity.referenceNumber,
        extra: {
          ...existingExtra,
          ...incomingExtra,
          raw: incomingExtra.raw ?? existingExtra.raw ?? {},
        } as never,
      };
      const comparable = (value: unknown): string => {
        if (value instanceof Date) return value.toISOString();
        if (value && typeof value === "object" && "toNumber" in value) {
          return String((value as { toNumber(): number }).toNumber());
        }
        return JSON.stringify(value);
      };
      const hasChanges = Object.entries(updateData).some(
        ([key, value]) =>
          comparable(value) !== comparable(opportunity[key as keyof typeof opportunity]),
      );
      const updatedOpportunity = hasChanges
        ? await prisma.opportunity.update({
            where: { id: opportunity.id },
            data: updateData,
          })
        : opportunity;

      await prisma.opportunitySource.upsert({
        where: {
          opportunityId_sourceId_sourceUrl: {
            opportunityId: existingLink.opportunityId,
            sourceId,
            sourceUrl: normalized.sourceUrl,
          },
        },
        update: {
          rawOpportunityId: rawOpportunityId ?? undefined,
          sourceTitle: normalized.title,
          publishedAt: normalized.publishedAt ? new Date(normalized.publishedAt) : null,
          deadline: normalized.deadline ? new Date(normalized.deadline) : null,
          lastSeenAt: new Date(),
        },
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

      if (hasChanges) {
        await createVersion({
          opportunityId: updatedOpportunity.id,
          snapshot: {
            ...normalized,
            ...updateData,
            sourceUrl: normalized.sourceUrl,
          } as unknown as Record<string, unknown>,
          createdByRunId: sourceRunId,
        });
      }

      return { opportunity: updatedOpportunity, created: false };
    }
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

  return { opportunity: created, created: true };
}