export const ELIGIBILITY_PROMPT_VERSION = "eligibility.v1";

export function ELIGIBILITY_PROMPT(input: {
  title: string;
  eligibility: string;
  requirements: string;
}): string {
  return `Analyse the eligibility for the opportunity below.

Title: ${input.title}
Eligibility: ${input.eligibility}
Requirements: ${input.requirements}

Return strict JSON with fields:
- summary (string)
- requirements (string array)
- redFlags (string array)`;
}