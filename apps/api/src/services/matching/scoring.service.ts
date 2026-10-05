import type { MatchBreakdownItem, MatchWeights } from "../../types/match";

export interface ScoreInputs {
  industryScore: number;
  locationScore: number;
  capabilityScore: number;
  valueScore: number;
  eligibilityScore: number;
  experienceScore: number;
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
  const breakdown: MatchBreakdownItem[] = [
    { key: "industry", label: "Industry", score: inputs.industryScore, max: weights.industry },
    { key: "location", label: "Location", score: inputs.locationScore, max: weights.location },
    { key: "capability", label: "Capability", score: inputs.capabilityScore, max: weights.capability },
    { key: "value", label: "Value", score: inputs.valueScore, max: weights.value },
    { key: "eligibility", label: "Eligibility", score: inputs.eligibilityScore, max: weights.eligibility },
    { key: "experience", label: "Experience", score: inputs.experienceScore, max: weights.experience },
  ];
  const total = breakdown.reduce((sum, item) => sum + item.score, 0);
  return { total: Math.min(100, Math.max(0, total)), breakdown };
}