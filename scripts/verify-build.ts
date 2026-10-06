#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

interface Step {
  name: string;
  command: string;
}

const steps: Step[] = [
  { name: "shared", command: "npm run build:shared" },
  { name: "prisma client", command: "npm run db:generate" },
  { name: "api", command: "npm run build:api" },
  { name: "web", command: "npm run build:web" },
];

for (const step of steps) {
  console.log(`[verify-build] step: ${step.name}`);
  execSync(step.command, { stdio: "inherit", cwd: ROOT });
}

const expectedArtifacts = [
  "packages/shared/dist",
  "apps/api/dist",
  "apps/web/dist",
];

let allPresent = true;
for (const artifact of expectedArtifacts) {
  const path = resolve(ROOT, artifact);
  if (!existsSync(path)) {
    console.error(`[verify-build] missing artifact: ${artifact}`);
    allPresent = false;
    continue;
  }
  const entries = readdirSync(path);
  if (entries.length === 0) {
    console.error(`[verify-build] artifact is empty: ${artifact}`);
    allPresent = false;
    continue;
  }
  console.log(`[verify-build] artifact OK: ${artifact}`);
}

if (!allPresent) {
  console.error("[verify-build] one or more artifacts are missing or empty");
  process.exit(1);
}

console.log("[verify-build] all build artifacts present");