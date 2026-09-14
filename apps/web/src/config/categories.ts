export type CategoryOption = {
  value: string;
  label: string;
  group: string;
};

export const opportunityCategories: CategoryOption[] = [
  { value: "PROCUREMENT", label: "Procurement", group: "Business" },
  { value: "CONTRACTS", label: "Contracts", group: "Business" },
  { value: "GRANTS", label: "Grants", group: "Funding" },
  { value: "FUNDING", label: "Funding", group: "Funding" },
  { value: "INVESTMENT", label: "Investment", group: "Funding" },
  { value: "EMPLOYMENT", label: "Jobs", group: "Career" },
  { value: "INTERNSHIPS", label: "Internships", group: "Career" },
  { value: "FELLOWSHIPS", label: "Fellowships", group: "Career" },
  { value: "SCHOLARSHIPS", label: "Scholarships", group: "Education" },
  { value: "TRAINING", label: "Training", group: "Education" },
  { value: "RESEARCH", label: "Research", group: "Education" },
  { value: "ACCELERATORS", label: "Accelerators", group: "Startup" },
  { value: "INCUBATORS", label: "Incubators", group: "Startup" },
  { value: "COMPETITIONS", label: "Competitions", group: "Startup" },
  { value: "PARTNERSHIPS", label: "Partnerships", group: "Development" },
  { value: "DEVELOPMENT", label: "Development", group: "Development" },
  { value: "OTHER", label: "Other", group: "Other" },
];

export const categoryGroups = [
  "Business",
  "Funding",
  "Career",
  "Education",
  "Startup",
  "Development",
  "Other",
] as const;

export const opportunityTypes: CategoryOption[] = [
  { value: "TENDER", label: "Tender", group: "Procurement" },
  { value: "RFP", label: "Request for Proposal", group: "Procurement" },
  { value: "RFQ", label: "Request for Quotation", group: "Procurement" },
  { value: "CONTRACT", label: "Contract", group: "Business" },
  { value: "GRANT", label: "Grant", group: "Funding" },
  { value: "FUNDING", label: "Funding", group: "Funding" },
  { value: "JOB", label: "Job", group: "Career" },
  { value: "INTERNSHIP", label: "Internship", group: "Career" },
  { value: "SCHOLARSHIP", label: "Scholarship", group: "Education" },
  { value: "FELLOWSHIP", label: "Fellowship", group: "Career" },
  { value: "ACCELERATOR", label: "Accelerator", group: "Startup" },
  { value: "INCUBATOR", label: "Incubator", group: "Startup" },
  { value: "COMPETITION", label: "Competition", group: "Startup" },
  { value: "HACKATHON", label: "Hackathon", group: "Startup" },
  { value: "TRAINING", label: "Training", group: "Education" },
  { value: "RESEARCH", label: "Research", group: "Education" },
  { value: "PARTNERSHIP", label: "Partnership", group: "Business" },
  { value: "INVESTMENT", label: "Investment", group: "Funding" },
  { value: "CONSULTANCY", label: "Consultancy", group: "Business" },
  { value: "SUPPLIER", label: "Supplier", group: "Business" },
  { value: "VENDOR", label: "Vendor", group: "Business" },
  { value: "CALL_FOR_PROPOSALS", label: "Call for Proposals", group: "Development" },
  { value: "OTHER", label: "Other", group: "Other" },
];

export function labelForCategory(value: string): string {
  return opportunityCategories.find((c) => c.value === value)?.label ?? value;
}

export function labelForOpportunityType(value: string): string {
  return opportunityTypes.find((t) => t.value === value)?.label ?? value;
}