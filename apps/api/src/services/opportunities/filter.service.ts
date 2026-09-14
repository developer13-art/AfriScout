import type { OpportunityFilterInput } from "../../validators/opportunity.validator";
import { prisma } from "../../config/database";

export async function buildFacets(filters: OpportunityFilterInput) {
  const [categories, countries, types] = await Promise.all([
    prisma.opportunity.groupBy({
      by: ["category"],
      where: filters.category ? { category: filters.category } : undefined,
      _count: { _all: true },
    }),
    prisma.opportunity.groupBy({
      by: ["countryCode"],
      where: filters.countryCode ? { countryCode: filters.countryCode } : undefined,
      _count: { _all: true },
    }),
    prisma.opportunity.groupBy({
      by: ["opportunityType"],
      where: filters.opportunityType
        ? { opportunityType: filters.opportunityType }
        : undefined,
      _count: { _all: true },
    }),
  ]);

  return {
    categories: categories.map((c) => ({ value: c.category, count: c._count._all })),
    countries: countries
      .filter((c) => c.countryCode)
      .map((c) => ({ value: c.countryCode, count: c._count._all })),
    types: types.map((t) => ({ value: t.opportunityType, count: t._count._all })),
  };
}