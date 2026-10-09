import { describe, expect, it, vi } from "vitest";

vi.mock("../../config/ai", () => ({ aiConfig: { enabled: false } }));
vi.mock("../ai/provider.registry", () => ({ configuredChain: () => [] }));
vi.mock("../ai/ai.service", () => ({ runAi: vi.fn() }));

import {
  buildDiscoveryQueries,
  canonicalCategory,
  extractSearchResults,
  nameSimilarity,
  normalizedCandidateUrl,
} from "./sourceDiscoveryAnalysis.service";

describe("source discovery analysis helpers", () => {
  it("builds bounded, location-aware queries from the selected search inputs", () => {
    const queries = buildDiscoveryQueries({
      scope: "CUSTOM",
      countries: ["NG"],
      categories: ["grants"],
      sourceTypes: ["foundation"],
    });

    expect(queries).toHaveLength(2);
    expect(queries.every((query) => query.includes("Nigeria"))).toBe(true);
    expect(queries.some((query) => query.includes("foundation"))).toBe(true);
    expect(buildDiscoveryQueries({
      scope: "GLOBAL",
      countries: [],
      categories: [],
      sourceTypes: [],
    }).length).toBeLessThanOrEqual(40);
  });

  it("extracts nested search results, normalizes URLs, and keeps one result per host", () => {
    const results = extractSearchResults([
      {
        searchString: "Nigeria grant opportunities",
        organicResults: [
          {
            title: "Official Grant Portal",
            url: "https://www.example.org/grants/?utm_source=google#open",
            description: "Applications are open for nonprofit grants.",
          },
          {
            title: "Another result on same site",
            url: "https://example.org/about",
            description: "Organization details.",
          },
        ],
      },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      title: "Official Grant Portal",
      url: "https://example.org/grants",
      description: "Applications are open for nonprofit grants.",
      query: "Nigeria grant opportunities",
    });
  });

  it("rejects unsafe or local URLs and removes common tracking parameters", () => {
    expect(normalizedCandidateUrl("javascript:alert(1)")).toBeNull();
    expect(normalizedCandidateUrl("http://localhost:8080/private")).toBeNull();
    expect(normalizedCandidateUrl("https://example.com/jobs?utm_campaign=search&id=4"))
      .toBe("https://example.com/jobs?id=4");
  });

  it("uses conservative category aliases and token overlap for duplicate review", () => {
    expect(canonicalCategory("jobs")).toBe("EMPLOYMENT");
    expect(canonicalCategory("startup programs")).toBe("ACCELERATORS");
    expect(nameSimilarity("Global Grants Foundation", "Global Grants Foundation")).toBe(100);
    expect(nameSimilarity("Global Grants", "University Careers")).toBe(0);
  });
});
