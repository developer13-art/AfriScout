#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");
const MODE = process.argv[2] ?? "dev";

const command =
  MODE === "deploy"
    ? "npm run db:migrate:deploy"
    : MODE === "reset"
      ? "npm run db:reset"
      : "npm run db:migrate";

console.log(`[migrate] mode=${MODE}`);
execSync(command, { stdio: "inherit", cwd: ROOT });
console.log("[migrate] done");