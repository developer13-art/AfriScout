import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export async function listDocumentsByOpportunity(opportunityId: string) {
  return prisma.opportunityDocument.findMany({
    where: { opportunityId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDocument(documentId: string) {
  const doc = await prisma.opportunityDocument.findUnique({
    where: { id: documentId },
  });
  if (!doc) throw new NotFoundError("Document not found");
  return doc;
}

export async function createDocument(input: {
  opportunityId: string;
  sourceId?: string | null;
  url: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  checksum?: string | null;
}) {
  return prisma.opportunityDocument.create({
    data: {
      opportunityId: input.opportunityId,
      sourceId: input.sourceId ?? null,
      url: input.url,
      fileName: input.fileName ?? null,
      mimeType: input.mimeType ?? null,
      fileSize: input.fileSize != null ? BigInt(input.fileSize) : null,
      checksum: input.checksum ?? null,
    },
  });
}

export async function markExtractionResult(
  documentId: string,
  status: "PENDING" | "FETCHING" | "EXTRACTING" | "EXTRACTED" | "FAILED" | "SKIPPED",
  payload: {
    extractedText?: string | null;
    extractedFields?: Record<string, unknown> | null;
    errorMessage?: string | null;
  } = {},
) {
  return prisma.opportunityDocument.update({
    where: { id: documentId },
    data: {
      extractionStatus: status,
      extractedText: payload.extractedText ?? undefined,
      extractedFields: payload.extractedFields as never,
      extractionError: payload.errorMessage ?? null,
      fetchedAt: status === "EXTRACTED" ? new Date() : undefined,
    },
  });
}