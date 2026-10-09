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

  it("maps common actor field names and preserves the complete actor payload", () => {
    const actorItem = {
      title: "Product Design Fellowship",
      company: "Design Lab",
      locationText: "Lagos, Nigeria",
      fullDescription: "A twelve-month paid product design fellowship.",
      url: "https://opportunity.example/fellowship",
      applyUrl: "https://opportunity.example/fellowship/apply",
      applicationDeadline: "2026-12-31",
      requiredDocuments: ["Portfolio", "CV"],
      customActorField: { source: "listing-page" },
      sourceId: "source-2",
    } as unknown as Parameters<typeof normalizeOpportunity>[0];

    const result = normalizeOpportunity(actorItem);

    expect(result.organizationName).toBe("Design Lab");
    expect(result.locationText).toBe("Lagos, Nigeria");
    expect(result.description).toContain("twelve-month paid");
    expect(result.sourceUrl).toBe("https://opportunity.example/fellowship");
    expect(result.applicationUrl).toBe("https://opportunity.example/fellowship/apply");
    expect(result.deadline).toBe("2026-12-31T00:00:00.000Z");
    expect(result.extra).toMatchObject({
      raw: { customActorField: { source: "listing-page" } },
      documents: ["Portfolio", "CV"],
    });
  });
});
