import type { DnaMatchInput } from "../dna/dnaBuilder.service";

export function scoreValue(
  dna: DnaMatchInput,
  opportunity: {
    valueMin: number | null;
    valueMax: number | null;
    currency: string | null;
  },
): { score: number; reason?: string; concern?: string } {
  const max = 15;

  if (opportunity.valueMin == null && opportunity.valueMax == null) {
    return { score: Math.round(max * 0.6), reason: "Value not specified" };
  }

  const oppMin = opportunity.valueMin ?? 0;
  const oppMax = opportunity.valueMax ?? oppMin;

  if (dna.minValue == null && dna.maxValue == null) {
    return { score: Math.round(max * 0.7), reason: "No value capacity set in DNA" };
  }

  const dnaMin = dna.minValue ?? 0;
  const dnaMax = dna.maxValue ?? Number.MAX_SAFE_INTEGER;

  const intersects = oppMax >= dnaMin && oppMin <= dnaMax;
  if (intersects) return { score: max, reason: "Value range is within your capacity" };

  return { score: Math.round(max * 0.3), concern: "Value range is outside your capacity" };
}