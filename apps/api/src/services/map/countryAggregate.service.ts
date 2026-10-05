import { prisma } from "../../config/database";
import { listCountries } from "./geo.service";

export interface CountryAggregate {
  countryCode: string;
  countryName: string;
  count: number;
}

export async function aggregateByCountry(): Promise<CountryAggregate[]> {
  const grouped = await prisma.opportunity.groupBy({
    by: ["countryCode"],
    _count: { _all: true },
    where: { status: "PUBLISHED" },
  });

  const countries = await listCountries();
  const nameMap = new Map(countries.map((c) => [c.code, c.name]));

  return grouped
    .filter((entry) => entry.countryCode)
    .map((entry) => ({
      countryCode: entry.countryCode as string,
      countryName: nameMap.get(entry.countryCode as string) ?? (entry.countryCode as string),
      count: entry._count._all,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function totalOpportunitiesByCountry(): Promise<number> {
  return prisma.opportunity.count({
    where: { status: "PUBLISHED", countryCode: { not: null } },
  });
}