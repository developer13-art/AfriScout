export const SUMMARY_PROMPT_VERSION = "summary.v1";

export function SUMMARY_PROMPT(input: {
  title: string;
  description: string;
  eligibility: string;
  requirements: string;
}): string {
  return `Summarise the following opportunity for a general African audience.

Title: ${input.title}
Description: ${input.description}
Eligibility: ${input.eligibility}
Requirements: ${input.requirements}

Return strict JSON with fields:
- summary (string)
- eligibility (string)
- requirements (string array)
- documents (string array)
- risks (string array)`;
}