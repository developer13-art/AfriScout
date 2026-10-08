import { logger } from "../../config/logger";
import { PROCESS_DOCUMENT_JOB } from "../definitions/processDocument.job";
import { fetchDocument } from "../../services/documents/documentFetch.service";
import { parseDocument } from "../../services/documents/documentParse.service";
import { extractDocumentFields } from "../../services/documents/documentExtract.service";
import { markExtractionResult, getDocument } from "../../services/documents/document.service";
import { storage } from "../../config/storage";

export async function processDocumentJob(job: { name: string; payload: unknown }): Promise<void> {
      if (job.name !== PROCESS_DOCUMENT_JOB) return;
      const { documentId } = job.payload as { documentId: string };
      const doc = await getDocument(documentId);

      await markExtractionResult(doc.id, "FETCHING");

      try {
        const fetched = await fetchDocument(doc.url);
        const buffer = fetched.storageKey ? await storage.get(fetched.storageKey) : null;
        const parseInput = buffer ?? Buffer.alloc(0);

        await markExtractionResult(doc.id, "EXTRACTING");

        const parsed = await parseDocument(parseInput, fetched.mimeType);
        const extracted = await extractDocumentFields({
          fileName: doc.fileName ?? "document",
          text: parsed.text,
        });

        await markExtractionResult(doc.id, "EXTRACTED", {
          extractedText: parsed.text,
          extractedFields: extracted as unknown as Record<string, unknown>,
        });
      } catch (error) {
        logger.error({ err: error, documentId }, "document_processing_failed");
        await markExtractionResult(doc.id, "FAILED", {
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
}