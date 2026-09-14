export type MatchBand =
  | "VERY_STRONG"
  | "STRONG"
  | "MODERATE"
  | "WEAK"
  | "POOR";

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

export interface Match {
  id: string;
  userId: string;
  dnaProfileId: string;
  opportunityId: string;
  score: number;
  band: MatchBand;
  breakdown: MatchBreakdownItem[];
  reasons: MatchReason[];
  concerns: MatchConcern[];
  weightsVersion: string;
  computedAt: string;
  notified: boolean;
}

export interface MatchWeights {
  id: string;
  userType: string;
  version: string;
  weights: Record<string, number>;
  active: boolean;
  createdAt: string;
}