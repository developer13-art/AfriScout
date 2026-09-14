export const REQUIREMENT_PROMPT_VERSION = "requirements.v1";

export function REQUIREMENT_PROMPT(input: {
  title: string;
  description: string | null;
  eligibility: string | null;
  requirements: string | null;
}): string {
  return `Extract structured requirements.

Title: ${input.title}
Description: ${input.description ?? ""}
Eligibility: ${input.eligibility ?? ""}
Requirements: ${input.requirements ?? ""}

Return strict JSON with field "requirements" containing an array of items:
- kind (DOCUMENT, EXPERIENCE, CERTIFICATION, FINANCIAL, TECHNICAL, ELIGIBILITY, GEOGRAPHIC, LEGAL, OTHER)
- label (string)
- description (string)
- isMandatory (boolean)`;
}