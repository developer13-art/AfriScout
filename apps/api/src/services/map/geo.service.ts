import { prisma } from "../../config/database";

export interface CountryEntry {
  code: string;
  name: string;
  region: string;
}

export async function listCountries(): Promise<CountryEntry[]> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "geo.countries" },
    select: { value: true },
  });
  if (!setting || !Array.isArray(setting.value)) return [];
  return setting.value as unknown as CountryEntry[];
}

export async function countryNameFor(code: string): Promise<string> {
  const countries = await listCountries();
  return countries.find((c) => c.code === code)?.name ?? code;
}