import { createHash } from "node:crypto";

export function hashSnapshot(snapshot: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}