import { fileURLToPath } from "node:url";
import path from "node:path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { readFileSync } from "node:fs";
import yaml from "yaml";
import type { Request, Response } from "express";

let cachedJson: string | null = null;

function loadSpec(): string {
  if (cachedJson) return cachedJson;
  const specPath = path.resolve(__dirname, "openapi.yaml");
  const raw = readFileSync(specPath, "utf8");
  cachedJson = JSON.stringify(yaml.parse(raw));
  return cachedJson;
}

export function serveOpenApiJson(_req: Request, res: Response): void {
  res.type("application/json").send(loadSpec());
}

export function serveOpenApiYaml(_req: Request, res: Response): void {
  const specPath = path.resolve(__dirname, "openapi.yaml");
  res.type("text/yaml").send(readFileSync(specPath, "utf8"));
}