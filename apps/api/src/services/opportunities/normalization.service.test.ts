import { describe, expect, it } from "vitest";
import { normalizeOpportunity } from "./normalization.service";

describe("normalizeOpportunity", () => {
  it("recovers scholarship details from the discovery listing text", () => {
    const result = normalizeOpportunity({
      title: "Commonwealth Master’s Scholarships: Commonwealth Scholarship Commission",
      organization: null,
      country: "BJ",
      location: null,
      category: "PROCUREMENT",
      publishedAt: null,
      deadline: null,
      description: null,
      sourceUrl: "https://opportunity.example/scholarships/commonwealth",
      sourceId: "source-1",
      adapter: "accelerator",
      raw: {
        listingText: "Scholarship 15 Oct 2026 Commonwealth Master’s Scholarships Commonwealth Scholarship Commission United Kingdom",
      },
    });

    expect(result.category).toBe("SCHOLARSHIPS");
    expect(result.opportunityType).toBe("SCHOLARSHIP");
    expect(result.organizationName).toBe("Commonwealth Scholarship Commission");
    expect(result.countryCode).toBe("GB");
    expect(result.locationText).toBe("United Kingdom");
    expect(result.deadline).toBe("2026-10-15T00:00:00.000Z");
    expect(result.description).toContain("Commonwealth Scholarship Commission");
  });
});
