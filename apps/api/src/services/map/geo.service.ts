import { africanCountries } from "../../../apps/web/src/config/countries";

import { prisma } from "../../config/database";

export interface CountryAggregateRow {
  countryCode: string;
  countryName: string;
  count: number;
}

export async function listCountries(): Promise<{ code: string; name: string; region: string }[]> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "geo.countries" },
    select: { value: true },
  });
  if (!setting || !Array.isArray(setting.value)) return [];
  return setting.value as { code: string; name: string; region: string }[];
}

export async function countryNameFor(code: string): Promise<string> {
  const countries = await listCountries();
  return countries.find((c) => c.code === code)?.name ?? code;
}