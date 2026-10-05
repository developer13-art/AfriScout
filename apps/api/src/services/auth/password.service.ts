import argon2 from "argon2";
import { env } from "../../config/env";

const options: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: env.PASSWORD_HASH_MEMORY_COST,
  timeCost: env.PASSWORD_HASH_TIME_COST,
  parallelism: env.PASSWORD_HASH_PARALLELISM,
};

export async function hashPassword(plaintext: string): Promise<string> {
  return argon2.hash(plaintext, options);
}

export async function verifyPassword(
  plaintext: string,
  hash: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    return false;
  }
}

export function isStrongPassword(value: string): boolean {
  if (typeof value !== "string") return false;
  if (value.length < 8) return false;
  if (value.length > 128) return false;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  return hasLetter && hasNumber;
}