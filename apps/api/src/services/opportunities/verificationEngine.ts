import { createHash } from "node:crypto";

export interface OpportunityVerificationFields {
  title: string;
  organizationName?: string | null;
  deadline?: string | null;
  sourceUrl: string;
  countryCode?: string | null;
  category: string;
  description?: string | null;
}

export interface SourceVerificationContext {
  active: boolean;
  health: string;
  url: string;
  trusted?: boolean | null;
  officialSource?: boolean | null;
  confidence?: number | null;
}

export interface VerificationInput {
  opportunity: OpportunityVerificationFields;
  source: SourceVerificationContext;
  duplicateRisk: number;
  aiConfidence: number;
  dataCompleteness: number;
  recent: boolean;
}

export type VerificationStatus = "VERIFIED" | "PARTIAL" | "DISPUTED";

export interface VerificationResult {
  status: VerificationStatus;
  score: number;
  checks: {
    sourceTrusted: boolean;
    officialSource: boolean;
    duplicateRisk: boolean;
    urlActive: boolean;
    requiredFieldsComplete: boolean;
    recent: boolean;
    aiConfidence: boolean;
  };
  issues: string[];
}

export interface MerkleProof {
  value: string;
  path: Array<{ hash: string; direction: "left" | "right" }>;
}

export interface MerkleTree {
  root: string;
  leaves: string[];
  proofs: MerkleProof[];
}

const REQUIRED_FIELDS = [
  "title",
  "organizationName",
  "sourceUrl",
  "countryCode",
  "category",
  "description",
] as const;

export function createOpportunityHash(opportunity: OpportunityVerificationFields): string {
  const canonical = {
    title: opportunity.title.trim(),
    organizationName: opportunity.organizationName?.trim() ?? null,
    deadline: opportunity.deadline ?? null,
    sourceUrl: opportunity.sourceUrl.trim(),
    countryCode: opportunity.countryCode?.trim().toUpperCase() ?? null,
    category: opportunity.category.trim().toUpperCase(),
    description: opportunity.description?.trim() ?? null,
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function createMerkleTree(leaves: string[]): MerkleTree {
  const normalized = [...leaves].map((leaf) => leaf.toLowerCase());
  if (normalized.length === 0) {
    return { root: createHash("sha256").update("empty-merkle-root").digest("hex"), leaves: [], proofs: [] };
  }

  const levels = [normalized];
  while (levels.at(-1)!.length > 1) {
    const current = levels.at(-1)!;
    const next: string[] = [];
    for (let index = 0; index < current.length; index += 2) {
      next.push(index + 1 < current.length ? hashPair(current[index], current[index + 1]) : current[index]);
    }
    levels.push(next);
  }

  const proofs = normalized.map((leaf) => buildProof(normalized, leaf));

  return { root: levels.at(-1)![0], leaves: normalized, proofs };
}

function buildProof(level: string[], value: string): MerkleProof {
  if (level.length === 1) return { value, path: [] };
  const index = level.indexOf(value);
  const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
  const sibling = siblingIndex < level.length ? level[siblingIndex] : level[index];
  const nextLevel = Array.from({ length: Math.ceil(level.length / 2) }, (_, nextIndex) =>
    hashPair(level[nextIndex * 2], level[nextIndex * 2 + 1] ?? level[nextIndex * 2]),
  );
  const parentHash = hashPair(level[index], sibling);
  const path = [
    { hash: sibling, direction: index % 2 === 0 ? "right" as const : "left" as const },
    ...buildProof(nextLevel, parentHash).path,
  ];
  return { value, path };
}

export function verifyOpportunityRecord(input: VerificationInput): VerificationResult {
  const requiredComplete = REQUIRED_FIELDS.every((field) => {
    const value = input.opportunity[field as keyof OpportunityVerificationFields];
    return typeof value === "string" && value.trim().length > 0;
  });
  const sourceTrusted = Boolean(input.source.trusted && input.source.active && input.source.health === "HEALTHY");
  const officialSource = Boolean(input.source.officialSource);
  const duplicateRisk = input.duplicateRisk <= 0.05;
  const urlActive = input.source.url === input.opportunity.sourceUrl;
  const recent = input.recent;
  const aiConfidence = input.aiConfidence >= 0.8;
  const checks = {
    sourceTrusted,
    officialSource,
    duplicateRisk,
    urlActive,
    requiredFieldsComplete: requiredComplete,
    recent,
    aiConfidence,
  };
  const score = Math.round(
    [sourceTrusted, officialSource, duplicateRisk, urlActive, requiredComplete, recent, aiConfidence]
      .filter(Boolean)
      .length * 100 / 7,
  );
  const issues: string[] = [];
  if (!sourceTrusted) issues.push("source_trusted=false");
  if (!officialSource) issues.push("official_source=false");
  if (!duplicateRisk) issues.push("duplicate_risk_exceeds_threshold");
  if (!urlActive) issues.push("source_url_mismatch");
  if (!requiredComplete) issues.push("required_fields_incomplete");
  if (!recent) issues.push("opportunity_not_recent");
  if (!aiConfidence) issues.push("ai_confidence_below_threshold");

  return {
    status: score >= 90 && issues.length === 0 ? "VERIFIED" : issues.length === 0 ? "VERIFIED" : "PARTIAL",
    score,
    checks,
    issues,
  };
}

function hashPair(left: string, right: string): string {
  return createHash("sha256").update(left < right ? `${left}:${right}` : `${right}:${left}`).digest("hex");
}
