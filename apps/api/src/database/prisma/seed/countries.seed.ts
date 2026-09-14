import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";

const COUNTRIES_KEY = "geo.countries";

const countries = [
  { code: "DZ", name: "Algeria", region: "North Africa" },
  { code: "AO", name: "Angola", region: "Southern Africa" },
  { code: "BJ", name: "Benin", region: "West Africa" },
  { code: "BW", name: "Botswana", region: "Southern Africa" },
  { code: "BF", name: "Burkina Faso", region: "West Africa" },
  { code: "BI", name: "Burundi", region: "East Africa" },
  { code: "CV", name: "Cabo Verde", region: "West Africa" },
  { code: "CM", name: "Cameroon", region: "Central Africa" },
  { code: "CF", name: "Central African Republic", region: "Central Africa" },
  { code: "TD", name: "Chad", region: "Central Africa" },
  { code: "KM", name: "Comoros", region: "East Africa" },
  { code: "CG", name: "Congo", region: "Central Africa" },
  { code: "CD", name: "Congo, Democratic Republic", region: "Central Africa" },
  { code: "CI", name: "Cote d'Ivoire", region: "West Africa" },
  { code: "DJ", name: "Djibouti", region: "East Africa" },
  { code: "EG", name: "Egypt", region: "North Africa" },
  { code: "GQ", name: "Equatorial Guinea", region: "Central Africa" },
  { code: "ER", name: "Eritrea", region: "East Africa" },
  { code: "SZ", name: "Eswatini", region: "Southern Africa" },
  { code: "ET", name: "Ethiopia", region: "East Africa" },
  { code: "GA", name: "Gabon", region: "Central Africa" },
  { code: "GM", name: "Gambia", region: "West Africa" },
  { code: "GH", name: "Ghana", region: "West Africa" },
  { code: "GN", name: "Guinea", region: "West Africa" },
  { code: "GW", name: "Guinea-Bissau", region: "West Africa" },
  { code: "KE", name: "Kenya", region: "East Africa" },
  { code: "LS", name: "Lesotho", region: "Southern Africa" },
  { code: "LR", name: "Liberia", region: "West Africa" },
  { code: "LY", name: "Libya", region: "North Africa" },
  { code: "MG", name: "Madagascar", region: "East Africa" },
  { code: "MW", name: "Malawi", region: "Southern Africa" },
  { code: "ML", name: "Mali", region: "West Africa" },
  { code: "MR", name: "Mauritania", region: "West Africa" },
  { code: "MU", name: "Mauritius", region: "East Africa" },
  { code: "MA", name: "Morocco", region: "North Africa" },
  { code: "MZ", name: "Mozambique", region: "Southern Africa" },
  { code: "NA", name: "Namibia", region: "Southern Africa" },
  { code: "NE", name: "Niger", region: "West Africa" },
  { code: "NG", name: "Nigeria", region: "West Africa" },
  { code: "RW", name: "Rwanda", region: "East Africa" },
  { code: "ST", name: "Sao Tome and Principe", region: "Central Africa" },
  { code: "SN", name: "Senegal", region: "West Africa" },
  { code: "SC", name: "Seychelles", region: "East Africa" },
  { code: "SL", name: "Sierra Leone", region: "West Africa" },
  { code: "SO", name: "Somalia", region: "East Africa" },
  { code: "ZA", name: "South Africa", region: "Southern Africa" },
  { code: "SS", name: "South Sudan", region: "East Africa" },
  { code: "SD", name: "Sudan", region: "North Africa" },
  { code: "TZ", name: "Tanzania", region: "East Africa" },
  { code: "TG", name: "Togo", region: "West Africa" },
  { code: "TN", name: "Tunisia", region: "North Africa" },
  { code: "UG", name: "Uganda", region: "East Africa" },
  { code: "ZM", name: "Zambia", region: "Southern Africa" },
  { code: "ZW", name: "Zimbabwe", region: "Southern Africa" },
];

export async function seedCountries(prisma: PrismaClient): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: COUNTRIES_KEY },
    update: { value: countries },
    create: {
      key: COUNTRIES_KEY,
      value: countries,
      description: "Reference list of African countries",
    },
  });
  logger.info({ count: countries.length }, "countries_seeded");
}