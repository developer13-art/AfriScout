import { prisma } from "../apps/api/src/config/database";

async function main() {
  // Most recent 20 source runs
  const runs = await prisma.sourceRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      sourceId: true,
      status: true,
      trigger: true,
      itemsFound: true,
      itemsImported: true,
      itemsDuplicate: true,
      createdAt: true,
      startedAt: true,
      finishedAt: true,
    },
  });

  console.log("=== Last 20 source runs ===");
  for (const run of runs) {
    console.log(
      `${run.createdAt.toISOString().slice(0, 16)}  ${run.status.padEnd(10)}  ` +
      `trigger=${run.trigger.padEnd(13)}  found=${run.itemsFound}  ` +
      `imported=${run.itemsImported}  dup=${run.itemsDuplicate}  id=${run.id.slice(0, 8)}`,
    );
  }

  // Counts per day for the last 14 days
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 14);
  since.setUTCHours(0, 0, 0, 0);

  const recent = await prisma.sourceRun.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, itemsImported: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay = new Map<string, { runs: number; imported: number }>();
  for (const r of recent) {
    const key = r.createdAt.toISOString().slice(0, 10);
    const cur = byDay.get(key) ?? { runs: 0, imported: 0 };
    cur.runs += 1;
    cur.imported += r.itemsImported;
    byDay.set(key, cur);
  }

  console.log("");
  console.log("=== Per-day totals (last 14 days) ===");
  for (const [day, counts] of byDay.entries()) {
    console.log(`${day}  runs=${counts.runs}  imported=${counts.imported}`);
  }

  // Total runs, most recent
  const totalRuns = await prisma.sourceRun.count();
  const totalImported = await prisma.sourceRun.aggregate({
    _sum: { itemsImported: true, itemsFound: true },
  });
  console.log("");
  console.log(`Total runs:      ${totalRuns}`);
  console.log(`Total imported:  ${totalImported._sum.itemsImported ?? 0}`);
  console.log(`Total found:     ${totalImported._sum.itemsFound ?? 0}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });