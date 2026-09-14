import { prisma } from "../../config/database";
import type { SearchBodyInput } from "../../validators/search.validator";

export async function searchOpportunities(input: SearchBodyInput) {
  const page = input.page ?? 1;
  const pageSize = Math.min(input.pageSize ?? 20, 100);
  const filters = (input.filters ?? {}) as Record<string, unknown>;

  const where: Record<string, unknown> = {
    AND: [
      { status: "PUBLISHED" },
      {
        OR: [
          { title: { contains: input.q, mode: "insensitive" } },
          { description: { contains: input.q, mode: "insensitive" } },
          { organizationName: { contains: input.q, mode: "insensitive" } },
        ],
      },
    ],
  };

  if (typeof filters.category === "string") {
    (where.AND as Array<Record<string, unknown>>).push({ category: filters.category });
  }
  if (typeof filters.countryCode === "string") {
    (where.AND as Array<Record<string, unknown>>).push({ countryCode: filters.countryCode });
  }
  if (typeof filters.deadlineBefore === "string") {
    (where.AND as Array<Record<string, unknown>>).push({
      deadline: { lte: new Date(filters.deadlineBefore) },
    });
  }
  if (typeof filters.isRemote === "boolean") {
    (where.AND as Array<Record<string, unknown>>).push({ isRemote: filters.isRemote });
  }

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