import { describe, expect, it } from "vitest";
import { parseOpportunityAnalysisOutput } from "./opportunityAnalyst.service";

const validOutput = {
  summary: "A public accelerator for founders in Kenya.",
  eligibility: "LIKELY",
  eligibilityReason: "The published requirements are clear and no material gap is evident.",
  requirements: ["Submit a business plan", "Meet the application deadline"],
  skills: ["Business planning", "Presentation"],
  risks: ["Application deadline may change"],
  recommendations: ["Review the official terms before applying"],
  confidence: 0.82,
};

describe("parseOpportunityAnalysisOutput", () => {
  it("accepts the strict evidence-first outcome schema", () => {
    expect(parseOpportunityAnalysisOutput(validOutput)).toEqual(validOutput);
  });

  it("rejects invalid eligibility and confidence values", () => {
    expect(() =>
      parseOpportunityAnalysisOutput({
        ...validOutput,
        eligibility: "MAYBE",
        confidence: 1.1,
      }),
    ).toThrow();
  });
});
