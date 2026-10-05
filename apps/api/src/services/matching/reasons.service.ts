import type { MatchReason } from "../../types/match";

export function buildReasons(input: {
  industry: { reason?: string };
  location: { reason?: string };
  capability: { reason?: string };
  value: { reason?: string };
  eligibility: { reason?: string };
}): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (input.industry.reason) reasons.push({ key: "industry", label: "Industry match", detail: input.industry.reason });
  if (input.location.reason) reasons.push({ key: "location", label: "Location match", detail: input.location.reason });
  if (input.capability.reason) reasons.push({ key: "capability", label: "Capability match", detail: input.capability.reason });
  if (input.value.reason) reasons.push({ key: "value", label: "Value fit", detail: input.value.reason });
  if (input.eligibility.reason) reasons.push({ key: "eligibility", label: "Eligibility fit", detail: input.eligibility.reason });
  return reasons;
}