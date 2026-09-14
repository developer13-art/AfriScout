#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

console.log("[reset-db] dropping and recreating the database");
execSync("npm run db:reset --workspace=apps/api", { stdio: "inherit", cwd: ROOT });
console.log("[reset-db] reseeding reference data");
execSync("npm run db:seed --workspace=apps/api", { stdio: "inherit", cwd: ROOT });
console.log("[reset-db] done");