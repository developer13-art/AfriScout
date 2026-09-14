import { http } from "./http";
import type { Match } from "../types/match";
import type { Opportunity } from "../types/opportunity";

export interface MatchesResponse {
  matches: Match[];
  opportunities: Record<string, Opportunity>;
}

export const matchingService = {
  list: (limit = 50) => http<MatchesResponse>("/matches", { query: { limit } }),

  forOpportunity: (opportunityId: string) =>
    http<Match | null>(`/matches/opportunity/${opportunityId}`),

  recompute: () => http<{ started: true }>("/matches/recompute", { method: "POST" }),
};