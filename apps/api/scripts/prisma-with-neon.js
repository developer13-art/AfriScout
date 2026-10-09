const { spawnSync } = require("node:child_process");
const path = require("node:path");

const args = process.argv.slice(2);
const env = { ...process.env };

if (env.NEON_DATABASE_URL) {
  env.DATABASE_URL = env.NEON_DATABASE_URL;

  if (args[0] === "migrate") {
    if (args[1] === "reset" && env.ALLOW_NEON_DATABASE_RESET !== "1") {
      console.error("Refusing to reset the Neon database without ALLOW_NEON_DATABASE_RESET=1.");
      process.exit(1);
    }
    if (!env.NEON_DATABASE_URL_DIRECT) {
      console.error("NEON_DATABASE_URL_DIRECT is required for Prisma migrations.");
      process.exit(1);
    }
    env.DATABASE_URL_DIRECT = env.NEON_DATABASE_URL_DIRECT;
  } else if (env.NEON_DATABASE_URL_DIRECT) {
    env.DATABASE_URL_DIRECT = env.NEON_DATABASE_URL_DIRECT;
  } else {
    env.DATABASE_URL_DIRECT = env.NEON_DATABASE_URL;
  }
} else if (env.NEON_DATABASE_URL_DIRECT) {
  console.error("NEON_DATABASE_URL must also be configured when using NEON_DATABASE_URL_DIRECT.");
  process.exit(1);
}

const prismaCli = require.resolve("prisma");
const schemaPath = path.resolve(__dirname, "../src/database/prisma/schema.prisma");
const result = spawnSync(
  process.execPath,
  [prismaCli, ...args, "--schema", schemaPath],
  { env, stdio: "inherit" },
);

if (result.error) {
  console.error(`Failed to start Prisma CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
