import { signPayload, signPayloadWithPrefix, verifySignature } from "../../utils/signature";

export function signWebhook(body: string, secret: string): string {
  return signPayloadWithPrefix(body, secret);
}

export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  return verifySignature(body, signature, secret);
}

export function rawSign(body: string, secret: string): string {
  return signPayload(body, secret);
}