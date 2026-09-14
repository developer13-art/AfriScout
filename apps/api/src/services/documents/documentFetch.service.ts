import { logger } from "../../config/logger";
import { storage } from "../../config/storage";
import { sha256Hex } from "../../utils/hash";
import { InternalError } from "../../utils/errors";

export interface FetchedDocument {
  url: string;
  mimeType: string | null;
  fileSize: number;
  storageKey: string | null;
  checksum: string;
}

export async function fetchDocument(url: string): Promise<FetchedDocument> {
  try {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) {
      throw new InternalError(`Fetch failed (${response.status})`, { url });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get("content-type");
    const checksum = sha256Hex(buffer);
    const ext = mimeType?.includes("pdf") ? "pdf"
      : mimeType?.includes("word") ? "docx"
        : mimeType?.includes("html") ? "html"
          : "bin";

    const key = `documents/${checksum.slice(0, 16)}.${ext}`;

    try {
      await storage.put(key, buffer, mimeType ?? "application/octet-stream");
    } catch (error) {
      logger.warn({ err: error, url }, "document_storage_failed");
    }

    return {
      url,
      mimeType,
      fileSize: buffer.byteLength,
      storageKey: key,
      checksum,
    };
  } catch (error) {
    logger.error({ err: error, url }, "document_fetch_failed");
    throw error;
  }
}