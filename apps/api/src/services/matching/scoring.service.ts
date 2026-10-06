import type { MatchBreakdownItem, MatchWeights } from "../../types/match";

export interface ScoreInputs {
  industryScore: number;
  locationScore: number;
  capabilityScore: number;
  valueScore: number;
  eligibilityScore: number;
  experienceScore: number;
  verifiedHistoryScore?: number;
  verifiedCredentialScore?: number;
  experienceReason?: string;
  verifiedHistoryReason?: string;
  verifiedCredentialReason?: string;
}

const FALLBACK_WEIGHTS: MatchWeights = {
  industry: 25,
  location: 20,
  capability: 20,
  value: 15,
  eligibility: 10,
  experience: 10,
};

export function scoreOpportunity(
  inputs: ScoreInputs,
  weights: MatchWeights = FALLBACK_WEIGHTS,
): { total: number; breakdown: MatchBreakdownItem[] } {
  const profileExperienceMax = Math.round(weights.experience * 0.6);
  const verifiedHistoryMax = Math.round(weights.experience * 0.2);
  const verifiedCredentialMax =
    weights.experience - profileExperienceMax - verifiedHistoryMax;
  const breakdown: MatchBreakdownItem[] = [
    { key: "industry", label: "Industry", score: inputs.industryScore, max: weights.industry },
    { key: "location", label: "Location", score: inputs.locationScore, max: weights.location },
    { key: "capability", label: "Capability", score: inputs.capabilityScore, max: weights.capability },
    { key: "value", label: "Value", score: inputs.valueScore, max: weights.value },
    { key: "eligibility", label: "Eligibility", score: inputs.eligibilityScore, max: weights.eligibility },
    {
      key: "experience",
      label: "Professional experience",
      score: bounded(inputs.experienceScore, profileExperienceMax),
      max: profileExperienceMax,
      reason: inputs.experienceReason,
    },
    {
      key: "verifiedHistory",
      label: "Verified completion history",
      score: bounded(inputs.verifiedHistoryScore ?? 0, verifiedHistoryMax),
      max: verifiedHistoryMax,
      reason: inputs.verifiedHistoryReason,
    },
    {
      key: "verifiedCredentials",
      label: "Organization credentials",
      score: bounded(inputs.verifiedCredentialScore ?? 0, verifiedCredentialMax),
      max: verifiedCredentialMax,
      reason: inputs.verifiedCredentialReason,
    },
  ];
  const total = breakdown.reduce((sum, item) => sum + item.score, 0);
  return { total: Math.min(100, Math.max(0, total)), breakdown };
}

function bounded(score: number, max: number): number {
  return Math.min(Math.max(score, 0), Math.max(max, 0));
}