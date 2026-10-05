import { prisma } from "../apps/api/src/config/database";

async function main() {
  const raws = await prisma.rawOpportunity.findMany({
    take: 3,
    orderBy: { fetchedAt: "desc" },
    select: { payload: true, sourceId: true },
  });
  for (const raw of raws) {
    console.log("---");
    console.log(JSON.stringify(raw.payload, null, 2).slice(0, 1500));
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });