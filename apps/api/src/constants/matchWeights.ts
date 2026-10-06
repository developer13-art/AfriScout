export const DEFAULT_MATCH_WEIGHTS = {
  INDUSTRY: 25,
  LOCATION: 20,
  CAPABILITY: 20,
  VALUE: 15,
  ELIGIBILITY: 10,
  EXPERIENCE: 10,
} as const;

export type MatchWeightKey = keyof typeof DEFAULT_MATCH_WEIGHTS;

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