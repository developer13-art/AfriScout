export const SOURCE_TYPES = [
  "GOVERNMENT",
  "PROCUREMENT_PORTAL",
  "UNIVERSITY",
  "NGO",
  "FOUNDATION",
  "ACCELERATOR",
  "GRANT_PORTAL",
  "JOB_BOARD",
  "SCHOLARSHIP_PORTAL",
  "DEVELOPMENT_ORG",
  "PRIVATE_COMPANY",
  "OTHER",
] as const;

export type SourceTypeKey = (typeof SOURCE_TYPES)[number];

export const SOURCE_TYPE_LABELS: Record<SourceTypeKey, string> = {
  GOVERNMENT: "Government",
  PROCUREMENT_PORTAL: "Procurement portal",
  UNIVERSITY: "University",
  NGO: "NGO",
  FOUNDATION: "Foundation",
  ACCELERATOR: "Accelerator",
  GRANT_PORTAL: "Grant portal",
  JOB_BOARD: "Job board",
  SCHOLARSHIP_PORTAL: "Scholarship portal",
  DEVELOPMENT_ORG: "Development organization",
  PRIVATE_COMPANY: "Private company",
  OTHER: "Other",
};