import type { Request, Response } from "express";
import { env } from "../config/env";
import * as OpportunityActionService from "../services/actions/opportunityAction.service";
import * as BountyService from "../services/bounties/bounty.service";
import { asyncHandler } from "../utils/asyncHandler";

function apiRoot() {
  return env.API_URL.replace(/\/+$/, "").replace(/\/api(?:\/v\d+)?$/, "");
}

function actionIcon() {
  return `${env.APP_URL.replace(/\/+$/, "")}/favicon.ico`;
}

export const manifest = (_req: Request, res: Response) => {
  res.json({
    rules: [
      {
        pathPattern: "/actions/v1/opportunities/**",
        apiPath: "/actions/v1/opportunities/**",
      },
      {
        pathPattern: "/actions/v1/bounties/**",
        apiPath: "/actions/v1/bounties/**",
      },
    ],
  });
};

export const getOpportunityAction = asyncHandler(async (req: Request, res: Response) => {
  const opportunity = await OpportunityActionService.getOpportunityAction(
    req.params.opportunityId,
  );
  const root = apiRoot();
  const actions = [
    {
      type: "external-link",
      label: "View opportunity",
      href: `${env.APP_URL.replace(/\/+$/, "")}/blink/${encodeURIComponent(opportunity.slug)}`,
    },
    {
      type: "transaction",
      label: "Save to Scout",
      href: `${root}/actions/v1/opportunities/${opportunity.id}/save`,
    },
  ];
  if (opportunity.bounty?.status === "OPEN") {
    actions.push({
      type: "transaction",
      label: "Join bounty on Devnet",
      href: `${root}/actions/v1/bounties/${opportunity.bounty.id}`,
    });
  }
  res.json({
    type: "action",
    title: opportunity.title,
    icon: actionIcon(),
    description:
      "View the live Scout opportunity, save it with a linked wallet, or join its open bounty. Save and join receipts are signed on Devnet; they do not transfer reward tokens.",
    label: "View on Scout",
    links: { actions },
  });
});

export const postOpportunitySaveAction = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await OpportunityActionService.createSaveTransaction(
      req.params.opportunityId,
      req.body.account,
    );
    res.json({
      ...result,
      links: {
        next: {
          type: "post",
          href: `${apiRoot()}/actions/v1/opportunities/${req.params.opportunityId}/saved`,
        },
      },
    });
  },
);

export const confirmOpportunitySaveAction = asyncHandler(
  async (req: Request, res: Response) => {
    const saved = await OpportunityActionService.confirmSave(
      req.params.opportunityId,
      req.body.account,
      req.body.signature,
    );
    res.json({
      type: "completed",
      title: "Opportunity saved",
      icon: actionIcon(),
      description: "The confirmed Devnet receipt linked this opportunity to your Scout saved list.",
      label: "Saved to Scout",
      saved,
    });
  },
);

export const getBountyAction = asyncHandler(async (req: Request, res: Response) => {
  const bounty = await BountyService.getBounty(req.params.bountyId);
  res.json({
    type: "action",
    title: `Join ${bounty.opportunity.title}`,
    icon: actionIcon(),
    description:
      "Join with a wallet linked to Scout, then submit a work link and description. Participation and proof fingerprints are recorded on Solana Devnet; rewards are not held in escrow.",
    label: bounty.status === "OPEN" ? "Join on Devnet" : "Bounty is closed",
    links: {
      actions: bounty.status === "OPEN" ? [
        {
          type: "transaction",
          label: "Join on Devnet",
          href: `${apiRoot()}/actions/v1/bounties/${bounty.id}`,
        },
      ] : [],
    },
  });
});

export const postBountyAction = asyncHandler(async (req: Request, res: Response) => {
  const result = await BountyService.createActionTransaction(
    req.params.bountyId,
    req.body.account,
  );
  res.json({
    ...result,
    links: {
      next: {
        type: "post",
        href: `${apiRoot()}/actions/v1/bounties/${req.params.bountyId}/participation-confirmed`,
      },
    },
  });
});

export const confirmActionParticipation = asyncHandler(async (req: Request, res: Response) => {
  const bounty = await BountyService.getBounty(req.params.bountyId);
  await BountyService.recordActionParticipation({
    bountyId: bounty.id,
    account: req.body.account,
    transactionSignature: req.body.signature,
  });

  const root = apiRoot();
  const proofActionUrl = `${root}/actions/v1/bounties/${bounty.id}/proof`;
  res.json({
    type: "action",
    title: "Participation confirmed",
    icon: actionIcon(),
    description:
      "Your Devnet participation receipt is verified. Submit a work link or summary next. Scout stores the submission privately; only its fingerprint is written on-chain.",
    label: "Submit proof",
    links: {
      actions: [
        {
          type: "transaction",
          label: "Submit proof",
          href: proofActionUrl,
          parameters: [
            {
              type: "url",
              name: "submissionUrl",
              label: "Link to your work (optional)",
            },
            {
              type: "textarea",
              name: "submissionText",
              label: "Describe your work (at least 20 characters)",
              required: true,
              min: 20,
              max: 12000,
            },
          ],
        },
      ],
    },
  });
});

export const getBountyProofAction = asyncHandler(async (req: Request, res: Response) => {
  const bounty = await BountyService.getBounty(req.params.bountyId);
  res.json({
    type: "action",
    title: `Submit work for ${bounty.opportunity.title}`,
    icon: actionIcon(),
    description:
      "Provide a work link and a short summary. The Scout account stores the submission; Solana Devnet receives only a SHA-256 fingerprint.",
    label: "Submit proof",
    links: {
      actions: [
        {
          type: "transaction",
          label: "Submit proof",
          href: `${apiRoot()}/actions/v1/bounties/${bounty.id}/proof`,
          parameters: [
            {
              type: "url",
              name: "submissionUrl",
              label: "Link to your work (optional)",
            },
            {
              type: "textarea",
              name: "submissionText",
              label: "Describe your work (at least 20 characters)",
              required: true,
              min: 20,
              max: 12000,
            },
          ],
        },
      ],
    },
  });
});

export const postBountyProofAction = asyncHandler(async (req: Request, res: Response) => {
  const result = await BountyService.createActionSubmissionTransaction({
    bountyId: req.params.bountyId,
    account: req.body.account,
    submissionUrl: req.query.submissionUrl as string | undefined,
    submissionText: req.query.submissionText as string | undefined,
  });
  res.json({
    transaction: result.transaction,
    message: result.message,
    links: {
      next: {
        type: "post",
        href: `${apiRoot()}/actions/v1/bounties/${req.params.bountyId}/proof-confirmed`,
      },
    },
  });
});

export const confirmActionProof = asyncHandler(async (req: Request, res: Response) => {
  await BountyService.confirmActionSubmission({
    bountyId: req.params.bountyId,
    account: req.body.account,
    transactionSignature: req.body.signature,
  });
  res.json({
    type: "completed",
    title: "Proof submitted",
    icon: actionIcon(),
    description:
      "Scout verified your Devnet proof fingerprint and sent your work to the organization for review. The organization decides whether the work qualifies for a reward and achievement.",
    label: "Submission sent",
  });
});
