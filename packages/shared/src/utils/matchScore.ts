import { bandForScore, type MatchBandKey } from "../constants/matchWeights";

export function scoreToPercent(score: number): string {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  return `${safe}%`;
}

export function bandLabel(band: MatchBandKey): string {
  switch (band) {
    case "VERY_STRONG":
      return "Very strong";
    case "STRONG":
      return "Strong";
    case "MODERATE":
      return "Moderate";
    case "WEAK":
      return "Weak";
    case "POOR":
      return "Poor";
  }
}

export function computeBand(score: number): MatchBandKey {
  return bandForScore(score);
}