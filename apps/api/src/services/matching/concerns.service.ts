import type { MatchConcern } from "../../types/match";

export function buildConcerns(input: {
  industry: { concern?: string };
  location: { concern?: string };
  capability: { concern?: string };
  value: { concern?: string };
  eligibility: { concern?: string };
}): MatchConcern[] {
  const concerns: MatchConcern[] = [];
  if (input.industry.concern) concerns.push({ key: "industry", label: "Industry concern", detail: input.industry.concern, severity: "MEDIUM" });
  if (input.location.concern) concerns.push({ key: "location", label: "Location concern", detail: input.location.concern, severity: "MEDIUM" });
  if (input.capability.concern) concerns.push({ key: "capability", label: "Capability concern", detail: input.capability.concern, severity: "MEDIUM" });
  if (input.value.concern) concerns.push({ key: "value", label: "Value concern", detail: input.value.concern, severity: "LOW" });
  if (input.eligibility.concern) concerns.push({ key: "eligibility", label: "Eligibility concern", detail: input.eligibility.concern, severity: "HIGH" });
  return concerns;
}