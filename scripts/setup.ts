#!/usr/bin/env tsx
import { execSync } from "node:child_process";
import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

function log(message: string): void {
  console.log(`[setup] ${message}`);
}

function run(command: string): void {
  log(`running: ${command}`);
  execSync(command, { stdio: "inherit", cwd: ROOT });
}

function ensureEnvFile(target: string, example: string): void {
  const targetPath = resolve(ROOT, target);
  const examplePath = resolve(ROOT, example);
  if (!existsSync(targetPath)) {
    if (!existsSync(examplePath)) {
      log(`missing ${example}, cannot create ${target}`);
      return;
    }
    copyFileSync(examplePath, targetPath);
    log(`created ${target} from ${example}`);
  } else {
    log(`${target} already exists, skipping`);
  }
}

function main(): void {
  log("AfriScout setup starting");

  ensureEnvFile(".env", ".env.example");
  ensureEnvFile(".env.test", ".env.test.example");

  run("npm install");
  run("npm run build:shared");
  run("npm run db:generate");
  run("npm run docker:up");
  log("waiting for Postgres and Redis to become healthy");
  run("sleep 5");
  run("npm run db:migrate");
  run("npm run db:seed");

  log("setup complete");
  log("next steps:");
  log("  1. fill in APIFY_TOKEN and AI provider keys in .env");
  log("  2. run: npm run dev");
  log("  3. open: http://localhost:5173");
}

main();