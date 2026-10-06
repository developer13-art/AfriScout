import type { DnaMatchInput } from "../dna/dnaBuilder.service";

export function scoreCapability(
  dna: DnaMatchInput,
  opportunity: {
    title: string;
    description: string | null;
    requirements: string | null;
    category: string;
  },
): { score: number; reason?: string; concern?: string } {
  const max = 20;
  const haystack = [
    opportunity.title,
    opportunity.description ?? "",
    opportunity.requirements ?? "",
    opportunity.category,
  ].join(" ").toLowerCase();

  if (dna.capabilities.length === 0) {
    return { score: Math.round(max * 0.5), reason: "No capabilities set in DNA" };
  }

  const matches = dna.capabilities.filter((cap) => haystack.includes(cap.toLowerCase()));
  if (matches.length === 0) {
    return { score: Math.round(max * 0.4), concern: "No capability overlap detected" };
  }

  const ratio = Math.min(1, matches.length / Math.max(3, dna.capabilities.length));
  const score = Math.round(max * (0.6 + 0.4 * ratio));
  return {
    score,
    reason: `Capabilities referenced: ${matches.slice(0, 3).join(", ")}`,
  };
}