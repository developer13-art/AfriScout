import fs from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

export interface StoredFile {
  key: string;
  size: number;
  contentType: string;
}

function resolveLocalPath(key: string): string {
  const root = path.resolve(env.STORAGE_LOCAL_PATH);
  const safeKey = key.replace(/^\/+/, "").replace(/\.\./g, "");
  return path.join(root, safeKey);
}

async function ensureLocalDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export const storage = {
  driver: env.STORAGE_DRIVER,

  async put(key: string, data: Buffer, contentType = "application/octet-stream"): Promise<StoredFile> {
    if (env.STORAGE_DRIVER !== "local") {
      throw new Error("Only local storage is implemented in this build");
    }
    const filePath = resolveLocalPath(key);
    await ensureLocalDir(filePath);
    await fs.writeFile(filePath, data);
    return { key, size: data.byteLength, contentType };
  },

  async get(key: string): Promise<Buffer | null> {
    if (env.STORAGE_DRIVER !== "local") {
      throw new Error("Only local storage is implemented in this build");
    }
    try {
      return await fs.readFile(resolveLocalPath(key));
    } catch {
      return null;
    }
  },

  async delete(key: string): Promise<void> {
    if (env.STORAGE_DRIVER !== "local") {
      throw new Error("Only local storage is implemented in this build");
    }
    try {
      await fs.unlink(resolveLocalPath(key));
    } catch {
      // ignore missing
    }
  },
};