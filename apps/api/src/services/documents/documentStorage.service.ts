import { storage } from "../../config/storage";

export async function saveDocument(
  key: string,
  data: Buffer,
  contentType = "application/octet-stream",
) {
  return storage.put(key, data, contentType);
}

export async function loadDocument(key: string): Promise<Buffer | null> {
  return storage.get(key);
}

export async function deleteDocument(key: string): Promise<void> {
  await storage.delete(key);
}

export function documentStorageDriver(): string {
  return storage.driver;
}