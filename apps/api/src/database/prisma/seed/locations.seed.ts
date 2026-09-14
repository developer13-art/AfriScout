import type { PrismaClient } from "@prisma/client";
import { logger } from "../../../config/logger";

const LOCATIONS_KEY = "geo.locations";

const locations = [
  { countryCode: "NG", region: "Kaduna", cities: ["Kaduna", "Zaria"] },
  { countryCode: "NG", region: "Abuja FCT", cities: ["Abuja"] },
  { countryCode: "NG", region: "Kano", cities: ["Kano"] },
  { countryCode: "NG", region: "Lagos", cities: ["Lagos", "Ikeja", "Lekki"] },
  { countryCode: "NG", region: "Rivers", cities: ["Port Harcourt"] },
  { countryCode: "GH", region: "Greater Accra", cities: ["Accra", "Tema"] },
  { countryCode: "KE", region: "Nairobi", cities: ["Nairobi"] },
  { countryCode: "KE", region: "Mombasa", cities: ["Mombasa"] },
  { countryCode: "ZA", region: "Gauteng", cities: ["Johannesburg", "Pretoria"] },
  { countryCode: "ZA", region: "Western Cape", cities: ["Cape Town"] },
  { countryCode: "EG", region: "Cairo", cities: ["Cairo"] },
  { countryCode: "RW", region: "Kigali", cities: ["Kigali"] },
  { countryCode: "TZ", region: "Dar es Salaam", cities: ["Dar es Salaam"] },
  { countryCode: "UG", region: "Kampala", cities: ["Kampala"] },
];

export async function seedLocations(prisma: PrismaClient): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: LOCATIONS_KEY },
    update: { value: locations },
    create: {
      key: LOCATIONS_KEY,
      value: locations,
      description: "Reference list of high-signal locations",
    },
  });
  logger.info({ count: locations.length }, "locations_seeded");
}