import type { DnaMatchInput } from "../dna/dnaBuilder.service";

export function scoreEligibility(
  dna: DnaMatchInput,
  opportunity: {
    eligibility: string | null;
    requirements: string | null;
  },
): { score: number; reason?: string; concern?: string } {
  const max = 10;
  const text = `${opportunity.eligibility ?? ""} ${opportunity.requirements ?? ""}`.toLowerCase();

  if (!text.trim()) {
    return { score: Math.round(max * 0.5), reason: "No eligibility text available" };
  }

  const matched = dna.capabilities.filter((cap) => text.includes(cap.toLowerCase()));
  if (matched.length > 0) {
    return { score: max, reason: `Capabilities referenced: ${matched.slice(0, 3).join(", ")}` };
  }

  const hasExperienceRequirement = /\b(experience|years|previous)\b/.test(text);
  if (hasExperienceRequirement) {
    return { score: Math.round(max * 0.6), concern: "Experience requirement may need review" };
  }

  return { score: Math.round(max * 0.8), reason: "Eligibility looks suitable" };
}