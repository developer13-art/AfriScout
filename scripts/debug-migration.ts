import { prisma } from "../apps/api/src/config/database";

async function main() {
  const result = await prisma.$queryRaw`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'source_runs' AND column_name = 'items_unchanged'
  `;
  console.log("items_unchanged column:", JSON.stringify(result, null, 2));

  const migrations = await prisma.$queryRaw`
    SELECT migration_name, finished_at
    FROM _prisma_migrations
    ORDER BY finished_at DESC
    LIMIT 5
  `;
  console.log("Recent migrations:", JSON.stringify(migrations, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });