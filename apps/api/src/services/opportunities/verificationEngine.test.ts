import { describe, expect, it } from "vitest";
import { createOpportunityHash, createMerkleTree, verifyOpportunityRecord } from "./verificationEngine";

const baseOpportunity = {
  title: "Grant A",
  organizationName: "African Development Bank",
  deadline: "2027-01-01T00:00:00.000Z",
  sourceUrl: "https://example.org/grant-a",
  countryCode: "NG",
  category: "GRANTS",
  description: "A global development grant.",
};

describe("verification engine", () => {
  it("creates a deterministic opportunity hash from the proof fields", () => {
    expect(createOpportunityHash(baseOpportunity)).toBe(
      createOpportunityHash(baseOpportunity),
    );
    expect(createOpportunityHash(baseOpportunity)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("builds a deterministic Merkle root and proof", () => {
    const leaves = ["a", "b", "c"].map((value) => createOpportunityHash({ ...baseOpportunity, title: value }));
    const tree = createMerkleTree(leaves);

    expect(tree.root).toMatch(/^[a-f0-9]{64}$/);
    expect(tree.root).toBe(createMerkleTree(leaves).root);
    expect(tree.proofs[0].path).toHaveLength(2);
    expect(tree.proofs[0].value).toBe(leaves[0]);
  });

  it("accepts a complete, unique, trusted opportunity", () => {
    const result = verifyOpportunityRecord({
      opportunity: baseOpportunity,
      source: {
        active: true,
        health: "HEALTHY",
        url: baseOpportunity.sourceUrl,
        trusted: true,
        officialSource: true,
      },
      duplicateRisk: 0.02,
      aiConfidence: 0.92,
      dataCompleteness: 0.95,
      recent: true,
    });

    expect(result.status).toBe("VERIFIED");
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.checks).toEqual(
      expect.objectContaining({
        sourceTrusted: true,
        officialSource: true,
        duplicateRisk: true,
        urlActive: true,
        requiredFieldsComplete: true,
        recent: true,
        aiConfidence: true,
      }),
    );
  });

  it("rejects an opportunity with missing required fields", () => {
    const result = verifyOpportunityRecord({
      opportunity: { ...baseOpportunity, description: null },
      source: { active: true, health: "HEALTHY", url: baseOpportunity.sourceUrl, trusted: true, officialSource: true },
      duplicateRisk: 0.01,
      aiConfidence: 0.9,
      dataCompleteness: 0.8,
      recent: true,
    });

    expect(result.status).toBe("PARTIAL");
    expect(result.checks.requiredFieldsComplete).toBe(false);
  });
});
