#!/usr/bin/env tsx
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

const requiredFiles = [".env", ".env.test"];
const optionalFiles = [".env.example", ".env.test.example"];

let hasError = false;

for (const file of requiredFiles) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) {
    console.error(`[check-env] missing required environment file: ${file}`);
    hasError = true;
  } else {
    console.log(`[check-env] found ${file}`);
  }
}

for (const file of optionalFiles) {
  const path = resolve(ROOT, file);
  if (!existsSync(path)) {
    console.warn(`[check-env] optional environment example missing: ${file}`);
  }
}

if (hasError) {
  console.error("[check-env] missing required environment files");
  process.exit(1);
}

console.log("[check-env] environment files present");