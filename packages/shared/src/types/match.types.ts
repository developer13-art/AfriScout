import type { MatchBandKey } from "../constants/matchWeights";

export interface MatchBreakdownItemDTO {
  key: string;
  label: string;
  score: number;
  max: number;
  reason?: string;
  concern?: string;
}

export interface MatchReasonDTO {
  key: string;
  label: string;
  detail?: string;
}

export interface MatchConcernDTO {
  key: string;
  label: string;
  detail?: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
}

export interface MatchDTO {
  id: string;
  userId: string;
  dnaProfileId: string;
  opportunityId: string;
  score: number;
  band: MatchBandKey;
  breakdown: MatchBreakdownItemDTO[];
  reasons: MatchReasonDTO[];
  concerns: MatchConcernDTO[];
  weightsVersion: string;
  computedAt: string;
  notified: boolean;
}