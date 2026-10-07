import { describe, expect, it } from "vitest";
import { scoreOpportunity } from "./scoring.service";

describe("scoreOpportunity", () => {
  it("allocates the experience weight across profile history and organization credentials", () => {
    const result = scoreOpportunity({
      industryScore: 25,
      locationScore: 20,
      capabilityScore: 20,
      valueScore: 15,
      eligibilityScore: 10,
      experienceScore: 6,
      verifiedHistoryScore: 2,
      verifiedCredentialScore: 2,
    });

    expect(result.total).toBe(100);
    expect(result.breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "experience", score: 6, max: 6 }),
        expect.objectContaining({ key: "verifiedHistory", score: 2, max: 2 }),
        expect.objectContaining({ key: "verifiedCredentials", score: 2, max: 2 }),
      ]),
    );
  });

  it("bounds history inputs and leaves the rest of the match score independent", () => {
    const result = scoreOpportunity({
      industryScore: 0,
      locationScore: 0,
      capabilityScore: 0,
      valueScore: 0,
      eligibilityScore: 0,
      experienceScore: 0,
      verifiedHistoryScore: 100,
      verifiedCredentialScore: 100,
    });

    expect(result.total).toBe(4);
    expect(result.breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "verifiedHistory", score: 2, max: 2 }),
        expect.objectContaining({ key: "verifiedCredentials", score: 2, max: 2 }),
      ]),
    );
  });
});
