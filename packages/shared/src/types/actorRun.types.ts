export type RunStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "ABORTED" | "TIMED_OUT";
export type RunTrigger = "SCHEDULE" | "MANUAL_ADMIN" | "WEBHOOK" | "RETRY";
export type RawStatus = "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED" | "SKIPPED";

export interface SourceRunDTO {
  id: string;
  sourceId: string;
  actorId?: string | null;
  apifyRunId?: string | null;
  apifyDatasetId?: string | null;
  status: RunStatus;
  trigger: RunTrigger;
  itemsFound: number;
  itemsImported: number;
  itemsUpdated: number;
  itemsDuplicate: number;
  itemsInvalid: number;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface RawOpportunityDTO {
  id: string;
  sourceId: string;
  sourceRunId?: string | null;
  apifyDatasetItemId?: string | null;
  payloadHash: string;
  fetchedAt: string;
  processedAt?: string | null;
  processingStatus: RawStatus;
  processingError?: string | null;
}