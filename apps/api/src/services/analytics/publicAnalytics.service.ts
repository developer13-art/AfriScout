import { prisma } from "../../config/database";

export interface PublicTotals {
  opportunitiesTotal: number;
  opportunitiesPublished: number;
  opportunitiesClosingSoon: number;
  opportunitiesClosingToday: number;
  sourcesTotal: number;
  sourcesActive: number;
  countriesCovered: number;
  usersTotal: number;
}

export interface CategoryCountPublic {
  category: string;
  count: number;
}

export interface CountryCountPublic {
  countryCode: string;
  countryName: string | null;
  count: number;
}

export interface PublicTotalsPayload {
  totals: PublicTotals;
  byCategory: CategoryCountPublic[];
}

const COUNTRY_NAME_MAP: Record<string, string> = {
  DZ: "Algeria", AO: "Angola", BJ: "Benin", BW: "Botswana", BF: "Burkina Faso",
  BI: "Burundi", CV: "Cabo Verde", CM: "Cameroon", CF: "Central African Republic",
  TD: "Chad", KM: "Comoros", CG: "Congo", CD: "Congo, Democratic Republic",
  CI: "Cote d'Ivoire", DJ: "Djibouti", EG: "Egypt", GQ: "Equatorial Guinea",
  ER: "Eritrea", SZ: "Eswatini", ET: "Ethiopia", GA: "Gabon", GM: "Gambia",
  GH: "Ghana", GN: "Guinea", GW: "Guinea-Bissau", KE: "Kenya", LS: "Lesotho",
  LR: "Liberia", LY: "Libya", MG: "Madagascar", MW: "Malawi", ML: "Mali",
  MR: "Mauritania", MU: "Mauritius", MA: "Morocco", MZ: "Mozambique",
  NA: "Namibia", NE: "Niger", NG: "Nigeria", RW: "Rwanda",
  ST: "Sao Tome and Principe", SN: "Senegal", SC: "Seychelles",
  SL: "Sierra Leone", SO: "Somalia", ZA: "South Africa", SS: "South Sudan",
  SD: "Sudan", TZ: "Tanzania", TG: "Togo", TN: "Tunisia", UG: "Uganda",
  ZM: "Zambia", ZW: "Zimbabwe",
};

export async function getPublicTotals(): Promise<PublicTotalsPayload> {
  const now = new Date();
  const next14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const endOfToday = new Date(now);
  endOfToday.setUTCHours(23, 59, 59, 999);

  const [
    opportunitiesTotal,
    opportunitiesPublished,
    opportunitiesClosingSoon,
    opportunitiesClosingToday,
    sourcesTotal,
    sourcesActive,
    usersTotal,
    categoryRows,
    countryRows,
  ] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.count({ where: { status: "PUBLISHED" } }),
    prisma.opportunity.count({
      where: { deadline: { gte: now, lte: next14 }, status: "PUBLISHED" },
    }),
    prisma.opportunity.count({
      where: { deadline: { gte: now, lte: endOfToday }, status: "PUBLISHED" },
    }),
    prisma.source.count(),
    prisma.source.count({ where: { active: true } }),
    prisma.user.count(),
    prisma.opportunity.groupBy({
      by: ["category"],
      _count: { _all: true },
      where: { status: "PUBLISHED" },
    }),
    prisma.opportunity.groupBy({
      by: ["countryCode"],
      _count: { _all: true },
      where: { status: "PUBLISHED", countryCode: { not: null } },
    }),
  ]);

  const countriesCovered = countryRows.filter((r) => r.countryCode).length;

  return {
    totals: {
      opportunitiesTotal,
      opportunitiesPublished,
      opportunitiesClosingSoon,
      opportunitiesClosingToday,
      sourcesTotal,
      sourcesActive,
      countriesCovered,
      usersTotal,
    },
    byCategory: categoryRows.map((row) => ({
      category: row.category,
      count: row._count._all,
    })),
  };
}

export async function getPublicCountryBreakdown(): Promise<CountryCountPublic[]> {
  const rows = await prisma.opportunity.groupBy({
    by: ["countryCode"],
    _count: { _all: true },
    where: { status: "PUBLISHED", countryCode: { not: null } },
  });

  return rows
    .filter((row) => row.countryCode)
    .map((row) => {
      const code = row.countryCode as string;
      return {
        countryCode: code,
        countryName: COUNTRY_NAME_MAP[code] ?? code,
        count: row._count._all,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export async function getPublicClosingSoon(): Promise<number> {
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setUTCHours(23, 59, 59, 999);

  return prisma.opportunity.count({
    where: { deadline: { gte: now, lte: endOfToday }, status: "PUBLISHED" },
  });
}