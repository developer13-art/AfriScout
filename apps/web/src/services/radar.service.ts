import { http } from "./http";
import type { Opportunity } from "../types/opportunity";
import type { Match } from "../types/match";

export interface RadarPayload {
  newOpportunities: Opportunity[];
  strongMatches: Match[];
  closingSoon: Opportunity[];
  recentlyUpdated: Opportunity[];
  watched: Opportunity[];
  saved: Opportunity[];
}

export const radarService = {
  get: () => http<RadarPayload>("/radar"),
};