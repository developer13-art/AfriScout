import { matchingQueue } from "../queues/matching.queue";

export interface MatchUsersPayload {
  opportunityId: string;
}

export const MATCH_USERS_JOB = "match-users";

export async function enqueueMatchUsers(payload: MatchUsersPayload) {
  return matchingQueue.add(MATCH_USERS_JOB, payload);
}

export interface RecomputeMatchesPayload {
  userId: string;
}

export const RECOMPUTE_MATCHES_JOB = "recompute-matches";

export async function enqueueRecomputeMatches(payload: RecomputeMatchesPayload) {
  return matchingQueue.add(RECOMPUTE_MATCHES_JOB, payload);
}