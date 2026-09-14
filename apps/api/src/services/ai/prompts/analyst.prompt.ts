export const ANALYST_PROMPT_VERSION = "analyst.v1";

export function ANALYST_PROMPT(input: {
  dnaSummary: string;
  opportunity: {
    title: string;
    description: string | null;
    eligibility: string | null;
    requirements: string | null;
    deadline: string | null;
    valueMin: number | null;
    valueMax: number | null;
    currency: string | null;
    countryCode: string | null;
    organizationName: string | null;
  };
}): string {
  const o = input.opportunity;
  return `You are advising a user on whether to pursue an opportunity.

DNA summary: ${input.dnaSummary}

Opportunity:
- Title: ${o.title}
- Organization: ${o.organizationName ?? ""}
- Country: ${o.countryCode ?? ""}
- Deadline: ${o.deadline ?? ""}
- Value: ${o.valueMin ?? ""} to ${o.valueMax ?? ""} ${o.currency ?? ""}
- Eligibility: ${o.eligibility ?? ""}
- Requirements: ${o.requirements ?? ""}
- Description: ${o.description ?? ""}

Return strict JSON with fields:
- recommendation (string)
- strengths (string array)
- concerns (string array)
- missingRequirements (string array)
- nextSteps (string array)`;
}