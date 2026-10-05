export const RECOMMENDATIONS_PROMPT_VERSION = "recommendations.v1";

export function RECOMMENDATIONS_PROMPT(input: {
  title: string;
  dnaSummary: string;
  deadline: string | null;
  requirements: string[];
}): string {
  return `Recommend next steps for the opportunity.

Title: ${input.title}
Deadline: ${input.deadline ?? ""}
DNA summary: ${input.dnaSummary}
Requirements: ${input.requirements.join("; ")}

Return strict JSON with fields:
- nextSteps (string array)
- reasoning (string)`;
}