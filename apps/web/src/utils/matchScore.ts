import type { MatchBand } from "../types/match";

export function matchBand(score: number): MatchBand {
  if (score >= 90) return "VERY_STRONG";
  if (score >= 75) return "STRONG";
  if (score >= 55) return "MODERATE";
  if (score >= 35) return "WEAK";
  return "POOR";
}

export function matchBandLabel(band: MatchBand): string {
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

export function matchScorePercent(score: number): string {
  const safe = Math.max(0, Math.min(100, Math.round(score)));
  return `${safe}%`;
}

export function matchTone(
  band: MatchBand,
): "success" | "primary" | "warning" | "danger" {
  switch (band) {
    case "VERY_STRONG":
    case "STRONG":
      return "success";
    case "MODERATE":
      return "primary";
    case "WEAK":
      return "warning";
    case "POOR":
      return "danger";
  }
}