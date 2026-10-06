import { pipelineQueue } from "../queues/pipeline.queue";

export interface DetectChangesPayload {
  opportunityId: string;
}

export const DETECT_CHANGES_JOB = "detect-changes";

export async function enqueueDetectChanges(payload: DetectChangesPayload) {
  return pipelineQueue.add(DETECT_CHANGES_JOB, payload);
}