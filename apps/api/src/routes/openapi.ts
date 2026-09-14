import { readFileSync } from "node:fs";
import path from "node:path";
import yaml from "yaml";
import type { Request, Response } from "express";

let cached: string | null = null;

function loadSpec(): string {
  if (cached) return cached;
  const filePath = path.resolve(__dirname, "../openapi/openapi.yaml");
  const raw = readFileSync(filePath, "utf8");
  cached = JSON.stringify(yaml.parse(raw));
  return cached;
}

export function openApiJson(_req: Request, res: Response): void {
  res.type("application/json").send(loadSpec());
}

export function openApiYaml(_req: Request, res: Response): void {
  res.type("text/yaml").send(readFileSync(path.resolve(__dirname, "../openapi/openapi.yaml"), "utf8"));
}