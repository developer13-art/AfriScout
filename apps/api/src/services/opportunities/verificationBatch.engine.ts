import { createOpportunityHash, createMerkleTree, type MerkleProof } from "./verificationEngine";

export interface VerificationBatchCandidate {
  opportunityId: string;
  title: string;
  organizationName?: string | null;
  deadline?: string | null;
  sourceUrl: string;
  countryCode?: string | null;
  category: string;
  description?: string | null;
  sourceConfidence: number;
  aiConfidence: number;
  dataCompleteness: number;
  duplicateRisk: number;
}

export interface VerificationBatchRecord {
  opportunityId: string;
  hash: string;
  status: "PENDING" | "VERIFIED" | "PARTIAL" | "DISPUTED";
  sourceConfidence: number;
  aiConfidence: number;
  dataCompleteness: number;
  merkleProof: MerkleProof;
}

export interface VerificationBatch {
  sourceRunId: string;
  rootHash: string;
  recordCount: number;
  records: VerificationBatchRecord[];
}

export function buildVerificationBatch(
  sourceRunId: string,
  candidates: VerificationBatchCandidate[],
): VerificationBatch {
  if (candidates.length === 0) {
    throw new Error("Verification batch requires at least one opportunity");
  }

  const records = candidates.map((candidate) => ({
    opportunityId: candidate.opportunityId,
    hash: createOpportunityHash(candidate),
    status: "PENDING" as const,
    sourceConfidence: candidate.sourceConfidence,
    aiConfidence: candidate.aiConfidence,
    dataCompleteness: candidate.dataCompleteness,
    merkleProof: { value: "", path: [] },
  }));
  const tree = createMerkleTree(records.map((record) => record.hash));
  records.forEach((record, index) => {
    record.merkleProof = tree.proofs[index];
  });

  return {
    sourceRunId,
    rootHash: tree.root,
    recordCount: records.length,
    records,
  };
}
