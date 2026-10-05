#!/usr/bin/env tsx
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "..");

interface ProcessSpec {
  name: string;
  command: string;
  args: string[];
  cwd: string;
  color: string;
}

const specs: ProcessSpec[] = [
  {
    name: "api",
    command: "npm",
    args: ["run", "dev:api"],
    cwd: ROOT,
    color: "\u001b[36m",
  },
  {
    name: "worker",
    command: "npm",
    args: ["run", "dev:worker"],
    cwd: ROOT,
    color: "\u001b[35m",
  },
  {
    name: "web",
    command: "npm",
    args: ["run", "dev:web"],
    cwd: ROOT,
    color: "\u001b[32m",
  },
];

const RESET = "\u001b[0m";

function prefixLines(name: string, color: string, data: Buffer): void {
  const lines = data.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line.length === 0) continue;
    process.stdout.write(`${color}[${name}]${RESET} ${line}\n`);
  }
}

function main(): void {
  const children = specs.map((spec) => {
    const child = spawn(spec.command, spec.args, {
      cwd: spec.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (data: Buffer) => prefixLines(spec.name, spec.color, data));
    child.stderr?.on("data", (data: Buffer) => prefixLines(spec.name, spec.color, data));
    child.on("exit", (code) => {
      console.log(`[${spec.name}] exited with code ${code}`);
    });
    return child;
  });

  const shutdown = () => {
    for (const child of children) {
      if (!child.killed) child.kill("SIGTERM");
    }
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();