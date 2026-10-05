import type { NormalizedOpportunity } from "../../types/opportunity";
import { isHttpUrl } from "../../utils/url";

export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validateNormalized(
  opportunity: NormalizedOpportunity,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!opportunity.title || opportunity.title.length < 3) {
    issues.push({ field: "title", message: "Title is too short" });
  }
  if (opportunity.title.length > 400) {
    issues.push({ field: "title", message: "Title is too long" });
  }
  if (!opportunity.sourceUrl || !isHttpUrl(opportunity.sourceUrl)) {
    issues.push({ field: "sourceUrl", message: "Source URL is invalid" });
  }
  if (opportunity.applicationUrl && !isHttpUrl(opportunity.applicationUrl)) {
    issues.push({ field: "applicationUrl", message: "Application URL is invalid" });
  }
  if (!opportunity.sourceId) {
    issues.push({ field: "sourceId", message: "Source ID is required" });
  }
  if (opportunity.deadline && opportunity.publishedAt) {
    const published = new Date(opportunity.publishedAt).getTime();
    const deadline = new Date(opportunity.deadline).getTime();
    if (Number.isFinite(published) && Number.isFinite(deadline) && deadline < published) {
      issues.push({
        field: "deadline",
        message: "Deadline is before the published date",
      });
    }
  }

  return { valid: issues.length === 0, issues };
}