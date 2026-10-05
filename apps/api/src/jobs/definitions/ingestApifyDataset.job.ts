import { pipelineQueue } from "../queues/pipeline.queue";

export interface IngestApifyDatasetPayload {
  sourceId: string;
  runId: string;
  datasetId: string;
}

export const INGEST_APIFY_DATASET_JOB = "ingest-apify-dataset";

export async function enqueueIngestApifyDataset(payload: IngestApifyDatasetPayload) {
  return pipelineQueue.add(INGEST_APIFY_DATASET_JOB, payload);
}