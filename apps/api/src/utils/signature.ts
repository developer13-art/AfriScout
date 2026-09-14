import { createHmac, timingSafeEqual } from "node:crypto";

export function signPayload(payload: string | Buffer, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signPayloadWithPrefix(
  payload: string | Buffer,
  secret: string,
  prefix = "sha256=",
): string {
  return `${prefix}${signPayload(payload, secret)}`;
}

export function verifySignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): boolean {
  const expected = signPayload(payload, secret);
  const provided = signature.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
}