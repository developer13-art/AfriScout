import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apifyConfig } from "../../config/apify";
import { env } from "../../config/env";
import { apifyRequest } from "./apify.service";

describe("apifyRequest", () => {
  const originalToken = env.APIFY_TOKEN;
  const originalActorId = apifyConfig.actors.opportunityDiscovery;
  const fetchMock = vi.fn();

  beforeEach(() => {
    env.APIFY_TOKEN = "test-only-apify-token";
    apifyConfig.actors.opportunityDiscovery = "test-actor";
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    env.APIFY_TOKEN = originalToken;
    apifyConfig.actors.opportunityDiscovery = originalActorId;
    vi.unstubAllGlobals();
  });

  it("calls the Apify API with bearer authentication and returns parsed JSON", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "run-123" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await apifyRequest<{ data: { id: string } }>("/actor-runs/run-123");

    expect(result.data.id).toBe("run-123");
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://api.apify.com/v2/actor-runs/run-123"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer test-only-apify-token",
        }),
      }),
    );
  });

  it("fails explicitly when the Apify token is not configured", async () => {
    env.APIFY_TOKEN = "";

    await expect(apifyRequest("/actor-runs/run-123")).rejects.toThrow(
      "Add APIFY_TOKEN to Replit Secrets",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
