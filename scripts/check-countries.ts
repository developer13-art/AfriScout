import { prisma } from "../apps/api/src/config/database";

async function main() {
  const total = await prisma.opportunity.count();
  const withCountry = await prisma.opportunity.count({ where: { countryCode: { not: null } } });
  const sample = await prisma.opportunity.findMany({
    take: 5,
    select: { title: true, countryCode: true, city: true, locationText: true },
  });
  const grouped = await prisma.opportunity.groupBy({
    by: ["countryCode"],
    _count: { _all: true },
  });

  console.log("Total opportunities:", total);
  console.log("With countryCode:", withCountry);
  console.log("");
  console.log("Sample (5):");
  for (const row of sample) {
    console.log(" -", row.title, "| countryCode:", row.countryCode, "| city:", row.city, "| loc:", row.locationText);
  }
  console.log("");
  console.log("Grouped by countryCode:");
  for (const row of grouped) {
    console.log(" -", row.countryCode, ":", row._count._all);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });