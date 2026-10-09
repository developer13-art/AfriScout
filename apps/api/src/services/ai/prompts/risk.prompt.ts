export const RISK_PROMPT_VERSION = "risk.v1";

export function RISK_PROMPT(input: {
  title: string;
  description: string | null;
  deadline: string | null;
  requirements: string | null;
}): string {
  return `Highlight risks and concerns.

Title: ${input.title}
Description: ${input.description ?? ""}
Deadline: ${input.deadline ?? ""}
Requirements: ${input.requirements ?? ""}

Return strict JSON with fields:
- risks (string array)
- concerns (string array)`;
}