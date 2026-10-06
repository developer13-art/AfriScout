import {
  randomBytes,
  randomUUID,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from "node:crypto";

export function generateId(): string {
  return randomUUID();
}

export function generateRandomString(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateHexToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function deriveKey(secret: string, salt: string): Buffer {
  return scryptSync(secret, salt, 32);
}

export function encryptString(plaintext: string, secret: string): string {
  const salt = randomBytes(16).toString("hex");
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(secret, salt);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [salt, iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptString(ciphertext: string, secret: string): string {
  const [salt, ivHex, tagHex, dataHex] = ciphertext.split(":");
  if (!salt || !ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid ciphertext format");
  }
  const key = deriveKey(secret, salt);
  const decipher = createDecipheriv(
    ENCRYPTION_ALGORITHM,
    key,
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}