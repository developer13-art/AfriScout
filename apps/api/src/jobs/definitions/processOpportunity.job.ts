import { pipelineQueue } from "../queues/pipeline.queue";

export interface ProcessOpportunityPayload {
  rawOpportunityId: string;
  sourceId: string;
}

export const PROCESS_OPPORTUNITY_JOB = "process-opportunity";

export async function enqueueProcessOpportunity(payload: ProcessOpportunityPayload) {
  return pipelineQueue.add(PROCESS_OPPORTUNITY_JOB, payload);
}