import { createHash, timingSafeEqual } from "node:crypto";

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function sha512Hex(input: string | Buffer): string {
  return createHash("sha512").update(input).digest("hex");
}

export function md5Hex(input: string | Buffer): string {
  return createHash("md5").update(input).digest("hex");
}

export function safeCompare(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function hashObject(value: unknown): string {
  return sha256Hex(JSON.stringify(value));
}