import type { MatchBandKey } from "../constants/matchWeights";

export interface MatchBreakdownItem {
  key: string;
  label: string;
  score: number;
  max: number;
  reason?: string;
  concern?: string;
}

export interface MatchReason {
  key: string;
  label: string;
  detail?: string;
}

export interface MatchConcern {
  key: string;
  label: string;
  detail?: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface MatchComputationInput {
  userId: string;
  dnaProfileId: string;
  opportunityId: string;
}

export interface MatchResult {
  score: number;
  band: MatchBandKey;
  breakdown: MatchBreakdownItem[];
  reasons: MatchReason[];
  concerns: MatchConcern[];
  weightsVersion: string;
}

export interface MatchWeights {
  industry: number;
  location: number;
  capability: number;
  value: number;
  eligibility: number;
  experience: number;
}