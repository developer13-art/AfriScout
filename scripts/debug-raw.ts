import { prisma } from "../apps/api/src/config/database";

async function main() {
  const raw = await prisma.rawOpportunity.count();
  const canonical = await prisma.opportunity.count();
  const sources = await prisma.opportunitySource.count();
  const runs = await prisma.sourceRun.count();

  console.log(`raw_opportunities rows:     ${raw}`);
  console.log(`opportunities rows:         ${canonical}`);
  console.log(`opportunity_sources rows:   ${sources}`);
  console.log(`source_runs rows:           ${runs}`);

  // Show a sample of recent raw records if any
  const recent = await prisma.rawOpportunity.findMany({
    orderBy: { fetchedAt: "desc" },
    take: 5,
    select: { id: true, sourceId: true, fetchedAt: true, processingStatus: true },
  });
  console.log("");
  console.log("=== Most recent raw_opportunities ===");
  for (const r of recent) {
    console.log(`${r.fetchedAt.toISOString()}  ${r.processingStatus}  source=${r.sourceId.slice(0, 8)}  id=${r.id.slice(0, 8)}`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });