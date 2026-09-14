import type { ExtractedOpportunity } from "../types";

export interface ValidationIssue {
  field: string;
  message: string;
}

export function validateExtracted(opportunity: ExtractedOpportunity): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!opportunity.title || opportunity.title.length < 3) {
    issues.push({ field: "title", message: "Title is too short" });
  }
  if (!opportunity.sourceUrl) {
    issues.push({ field: "sourceUrl", message: "Source URL is required" });
  }
  if (!opportunity.sourceId) {
    issues.push({ field: "sourceId", message: "Source ID is required" });
  }
  return issues;
}