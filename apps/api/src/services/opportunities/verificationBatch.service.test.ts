import { describe, expect, it } from "vitest";
import {
  buildVerificationBatch,
  type VerificationBatchCandidate,
} from "./verificationBatch.engine";

const candidates: VerificationBatchCandidate[] = [
  {
    opportunityId: "opportunity-a",
    title: "Grant A",
    organizationName: "African Development Bank",
    deadline: "2027-01-01T00:00:00.000Z",
    sourceUrl: "https://example.org/grant-a",
    countryCode: "NG",
    category: "GRANTS",
    description: "A grant",
    sourceConfidence: 0.96,
    aiConfidence: 0.9,
    dataCompleteness: 0.92,
    duplicateRisk: 0.01,
  },
  {
    opportunityId: "opportunity-b",
    title: "Grant B",
    organizationName: "Regional Fund",
    deadline: null,
    sourceUrl: "https://example.org/grant-b",
    countryCode: "KE",
    category: "GRANTS",
    description: "Another grant",
    sourceConfidence: 0.88,
    aiConfidence: 0.78,
    dataCompleteness: 0.9,
    duplicateRisk: 0.04,
  },
];

describe("verification batch construction", () => {
  it("builds stable, ordered records and a reproducible Merkle root", () => {
    const first = buildVerificationBatch("source-run-1", candidates);
    const second = buildVerificationBatch("source-run-1", candidates);

    expect(first).toEqual(second);
    expect(first.recordCount).toBe(2);
    expect(first.records.map((record) => record.opportunityId)).toEqual([
      "opportunity-a",
      "opportunity-b",
    ]);
    expect(first.rootHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.records[0].merkleProof.path).toHaveLength(1);
    expect(first.records[1].merkleProof.path).toHaveLength(1);
  });

  it("does not permit an empty batch", () => {
    expect(() => buildVerificationBatch("source-run-1", [])).toThrow(
      "Verification batch requires at least one opportunity",
    );
  });
});
