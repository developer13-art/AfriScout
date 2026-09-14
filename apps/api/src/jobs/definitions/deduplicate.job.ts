import { pipelineQueue } from "../queues/pipeline.queue";

export interface DeduplicatePayload {
  opportunityId: string;
}

export const DEDUPLICATE_JOB = "deduplicate";

export async function enqueueDeduplicate(payload: DeduplicatePayload) {
  return pipelineQueue.add(DEDUPLICATE_JOB, payload);
}