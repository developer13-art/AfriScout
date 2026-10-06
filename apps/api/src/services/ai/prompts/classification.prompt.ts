export const CLASSIFICATION_PROMPT_VERSION = "classification.v1";

export function CLASSIFICATION_PROMPT(input: {
  title: string;
  description: string;
  organizationName: string;
}): string {
  return `Classify the following opportunity into one of the AfriScout categories and types.

Title: ${input.title}
Organization: ${input.organizationName}
Description: ${input.description}

Return strict JSON with fields:
- category (one of PROCUREMENT, CONTRACTS, GRANTS, FUNDING, EMPLOYMENT, INTERNSHIPS, SCHOLARSHIPS, FELLOWSHIPS, ACCELERATORS, INCUBATORS, COMPETITIONS, TRAINING, RESEARCH, PARTNERSHIPS, INVESTMENT, DEVELOPMENT, OTHER)
- opportunityType (one of TENDER, RFP, RFQ, CONTRACT, GRANT, FUNDING, JOB, INTERNSHIP, SCHOLARSHIP, FELLOWSHIP, ACCELERATOR, INCUBATOR, COMPETITION, HACKATHON, TRAINING, RESEARCH, PARTNERSHIP, INVESTMENT, CONSULTANCY, SUPPLIER, VENDOR, CALL_FOR_PROPOSALS, OTHER)
- confidence (0 to 1)
- rationale (short sentence)`;
}