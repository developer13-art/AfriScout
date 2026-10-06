import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getOpportunityAction: getOpportunityActionMock } = vi.hoisted(() => ({
  getOpportunityAction: vi.fn(),
}));

vi.mock("../config/env", () => ({
  env: {
    APP_URL: "https://scout.example/",
    API_URL: "https://api.scout.example",
  },
}));

vi.mock("../services/actions/opportunityAction.service", () => ({
  getOpportunityAction: getOpportunityActionMock,
}));

vi.mock("../services/bounties/bounty.service", () => ({}));

import { getOpportunityAction } from "./actions.controller";

const opportunity = {
  id: "opportunity-id",
  title: "Procurement",
  slug: "procurement",
  bounty: null,
};

function createRequest(accept: string) {
  return {
    params: { opportunityId: opportunity.id },
    get: vi.fn().mockReturnValue(accept),
  } as unknown as Request;
}

function createResponse() {
  return {
    vary: vi.fn(),
    redirect: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
}

describe("opportunity Action browser response", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOpportunityActionMock.mockResolvedValue(opportunity);
  });

  it("redirects browser requests to the interactive opportunity card", async () => {
    const req = createRequest("text/html,application/xhtml+xml");
    const res = createResponse();

    getOpportunityAction(req, res, vi.fn());

    await vi.waitFor(() => {
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        "https://scout.example/blink/procurement",
      );
    });
    expect(res.vary).toHaveBeenCalledWith("Accept");
    expect(res.json).not.toHaveBeenCalled();
  });

  it("keeps returning protocol JSON to Solana Action clients", async () => {
    const req = createRequest("application/json");
    const res = createResponse();

    getOpportunityAction(req, res, vi.fn());

    await vi.waitFor(() => expect(res.json).toHaveBeenCalled());
    expect(res.redirect).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "action",
        links: {
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: "external-link",
              href: "https://scout.example/blink/procurement",
            }),
          ]),
        },
      }),
    );
  });
});
