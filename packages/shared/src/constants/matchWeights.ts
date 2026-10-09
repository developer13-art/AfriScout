export const DEFAULT_MATCH_WEIGHTS = {
  industry: 25,
  location: 20,
  capability: 20,
  value: 15,
  eligibility: 10,
  experience: 10,
} as const;

export const MATCH_WEIGHTS_VERSION = "v1";

export const MATCH_BANDS = {
  VERY_STRONG: { min: 90, label: "Very strong" },
  STRONG: { min: 75, label: "Strong" },
  MODERATE: { min: 55, label: "Moderate" },
  WEAK: { min: 35, label: "Weak" },
  POOR: { min: 0, label: "Poor" },
} as const;

export type MatchBandKey = keyof typeof MATCH_BANDS;

export function bandForScore(score: number): MatchBandKey {
  if (score >= MATCH_BANDS.VERY_STRONG.min) return "VERY_STRONG";
  if (score >= MATCH_BANDS.STRONG.min) return "STRONG";
  if (score >= MATCH_BANDS.MODERATE.min) return "MODERATE";
  if (score >= MATCH_BANDS.WEAK.min) return "WEAK";
  return "POOR";
}