import type { Request, Response } from "express";
import { env } from "../config/env";
import * as BountyService from "../services/bounties/bounty.service";
import { asyncHandler } from "../utils/asyncHandler";

export const manifest = (_req: Request, res: Response) => {
  res.json({
    rules: [
      {
        pathPattern: "/api/actions/v1/bounties/**",
        apiPath: "/api/actions/v1/bounties/**",
      },
    ],
  });
};

export const getBountyAction = asyncHandler(async (req: Request, res: Response) => {
  const bounty = await BountyService.getBounty(req.params.bountyId);
  const apiRoot = env.API_URL.replace(/\/+$/, "").replace(/\/api(?:\/v\d+)?$/, "");
  res.json({
    type: "action",
    title: `Join ${bounty.opportunity.title}`,
    icon: `${env.APP_URL.replace(/\/+$/, "")}/favicon.ico`,
    description:
      "Record participation on Solana Devnet. The listed reward is not held in escrow or guaranteed.",
    label: "Join on Devnet",
    links: {
      actions: [
        {
          label: "Join on Devnet",
          href: `${apiRoot}/actions/v1/bounties/${bounty.id}`,
        },
      ],
    },
  });
});

export const postBountyAction = asyncHandler(async (req: Request, res: Response) => {
  const result = await BountyService.createActionTransaction(
    req.params.bountyId,
    req.body.account,
  );
  res.json(result);
});
