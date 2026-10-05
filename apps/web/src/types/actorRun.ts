export type RunStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "ABORTED"
  | "TIMED_OUT";

export type RunTrigger = "SCHEDULE" | "MANUAL_ADMIN" | "WEBHOOK" | "RETRY";

export interface SourceRun {
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
  errorDetails?: Record<string, unknown> | null;
  createdBy?: string | null;
  createdAt: string;
}

export type RawStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | "SKIPPED";

export interface RawOpportunity {
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

export interface ActorRunFilters {
  sourceId?: string;
  status?: RunStatus;
  trigger?: RunTrigger;
  startedAfter?: string;
  startedBefore?: string;
}