import { matchingQueue } from "../queues/matching.queue";

export interface RecomputeAllMatchesPayload {
  limit?: number;
}

export const RECOMPUTE_ALL_MATCHES_JOB = "recompute-all-matches";

export async function enqueueRecomputeAllMatches(payload: RecomputeAllMatchesPayload = {}) {
  return matchingQueue.add(RECOMPUTE_ALL_MATCHES_JOB, payload);
}