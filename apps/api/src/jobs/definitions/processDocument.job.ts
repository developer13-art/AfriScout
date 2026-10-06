import { documentQueue } from "../queues/document.queue";

export interface ProcessDocumentPayload {
  documentId: string;
}

export const PROCESS_DOCUMENT_JOB = "process-document";

export async function enqueueProcessDocument(payload: ProcessDocumentPayload) {
  return documentQueue.add(PROCESS_DOCUMENT_JOB, payload);
}