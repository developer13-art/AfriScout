import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";
import type { OpportunityFilterInput } from "../../validators/opportunity.validator";
import { slugify, ensureUniqueSlug } from "../../utils/slugify";

export async function listOpportunities(input: OpportunityFilterInput) {
  const page = input.page ?? 1;
  const pageSize = Math.min(input.pageSize ?? 20, 100);
  const where = buildWhere(input);

  const [items, total] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.opportunity.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getOpportunityBySlug(slug: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { slug },
    include: {
      sources: true,
      documents: true,
      requirementsList: true,
    },
  });
  if (!opportunity) throw new NotFoundError("Opportunity not found");
  return opportunity;
}

export async function getOpportunityById(id: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      sources: true,
      documents: true,
      requirementsList: true,
    },
  });
  if (!opportunity) throw new NotFoundError("Opportunity not found");
  return opportunity;
}

export async function listOpportunityRequirements(opportunityId: string) {
  return prisma.opportunityRequirement.findMany({
    where: { opportunityId },
    orderBy: { createdAt: "asc" },
  });
}

export async function listOpportunityDocuments(opportunityId: string) {
  return prisma.opportunityDocument.findMany({
    where: { opportunityId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listOpportunitySources(opportunityId: string) {
  return prisma.opportunitySource.findMany({
    where: { opportunityId },
    orderBy: [{ isPrimary: "desc" }, { lastSeenAt: "desc" }],
  });
}

export async function listOpportunityChanges(opportunityId: string) {
  return prisma.opportunityChange.findMany({
    where: { opportunityId },
    orderBy: { detectedAt: "desc" },
  });
}

function buildWhere(input: OpportunityFilterInput) {
  const where: Record<string, unknown> = {};
  if (input.q) {
    where.OR = [
      { title: { contains: input.q, mode: "insensitive" } },
      { description: { contains: input.q, mode: "insensitive" } },
      { organizationName: { contains: input.q, mode: "insensitive" } },
    ];
  }
  if (input.category) where.category = input.category;
  if (input.opportunityType) where.opportunityType = input.opportunityType;
  if (input.countryCode) where.countryCode = input.countryCode;
  if (input.region) where.region = input.region;
  if (input.city) where.city = input.city;
  if (typeof input.isRemote === "boolean") where.isRemote = input.isRemote;
  if (typeof input.minValue === "number") where.valueMin = { gte: input.minValue };
  if (typeof input.maxValue === "number") where.valueMax = { lte: input.maxValue };
  if (input.currency) where.currency = input.currency;
  if (input.publishedAfter) where.publishedAt = { gte: new Date(input.publishedAfter) };
  if (input.deadlineAfter || input.deadlineBefore) {
    where.deadline = {};
    if (input.deadlineAfter) (where.deadline as Record<string, unknown>).gte = new Date(input.deadlineAfter);
    if (input.deadlineBefore) (where.deadline as Record<string, unknown>).lte = new Date(input.deadlineBefore);
  }
  if (input.status) where.status = input.status;
  if (input.verificationStatus) where.verificationStatus = input.verificationStatus;
  if (input.organizationId) where.organizationId = input.organizationId;
  if (input.sourceId) {
    where.sources = { some: { sourceId: input.sourceId } };
  }
  return where;
}

export async function generateOpportunitySlug(title: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;
  while (await prisma.opportunity.findUnique({ where: { slug: candidate } })) {
    candidate = ensureUniqueSlug(base, ++suffix);
  }
  return candidate;
}