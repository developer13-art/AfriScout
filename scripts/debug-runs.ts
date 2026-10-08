import { prisma } from "../apps/api/src/config/database";

async function main() {
  const runs = await prisma.sourceRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      status: true,
      trigger: true,
      itemsFound: true,
      itemsImported: true,
      itemsUpdated: true,
      itemsUnchanged: true,
      itemsDuplicate: true,
      itemsInvalid: true,
      createdAt: true,
    },
  });

  console.log("=== Last 10 runs (all counters) ===");
  for (const run of runs) {
    const ts = run.createdAt.toISOString().slice(0, 16).replace("T", " ");
    console.log(
      `${ts}  ${run.status.padEnd(10)}  ` +
      `found=${run.itemsFound} new=${run.itemsImported} ` +
      `upd=${run.itemsUpdated} unch=${run.itemsUnchanged} ` +
      `dup=${run.itemsDuplicate} inv=${run.itemsInvalid}`,
    );
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });