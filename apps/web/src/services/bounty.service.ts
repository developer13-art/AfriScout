import { env } from "../config/env";
import { http } from "./http";
import type { Bounty, BountySubmission } from "../types/bounty";

export interface BountyCreateInput {
  organizationId: string;
  title: string;
  description: string;
  rewardAmount: number;
  rewardCurrency: string;
  requiredSkills: string[];
  deadline?: string;
}

export const bountyService = {
  list: () => http<Bounty[]>("/bounties", { auth: false }),
  get: (id: string) => http<Bounty>(`/bounties/${id}`),
  byOpportunitySlug: (slug: string) =>
    http<Bounty | null>(`/bounties/by-opportunity/${encodeURIComponent(slug)}`, { auth: false }),
  managed: () => http<Bounty[]>("/bounties/managed"),
  create: (input: BountyCreateInput) =>
    http<Bounty>("/bounties", { method: "POST", body: JSON.stringify(input) }),
  mySubmission: (bountyId: string) =>
    http<BountySubmission | null>(`/bounties/${bountyId}/me`),
  submissions: (bountyId: string) =>
    http<BountySubmission[]>(`/bounties/${bountyId}/submissions`),
  payoutTransaction: (bountyId: string, submissionId: string, account: string) =>
    http<{ transaction: string; message: string; reservationId: string }>(
      `/bounties/${bountyId}/submissions/${submissionId}/payout-transaction`,
      { method: "POST", body: JSON.stringify({ account }) },
    ),
  actionTransaction: (bountyId: string, account: string) =>
    http<{ transaction: string; message: string }>(
      `${env.apiUrl.replace(/\/api\/v\d+\/?$/, "")}/actions/v1/bounties/${bountyId}`,
      { method: "POST", body: JSON.stringify({ account }), auth: false },
    ),
  actionSubmissionTransaction: (
    bountyId: string,
    account: string,
    submission: { submissionUrl?: string; submissionText?: string },
  ) =>
    http<{ transaction: string; message: string }>(
      `${env.apiUrl.replace(/\/api\/v\d+\/?$/, "")}/actions/v1/bounties/${bountyId}/proof`,
      {
        method: "POST",
        query: submission,
        body: JSON.stringify({ account }),
        auth: false,
      },
    ),
  confirmActionSubmission: (bountyId: string, account: string, signature: string) =>
    http<{ type: "completed"; title: string; description: string }>(
      `${env.apiUrl.replace(/\/api\/v\d+\/?$/, "")}/actions/v1/bounties/${bountyId}/proof-confirmed`,
      {
        method: "POST",
        body: JSON.stringify({ account, signature }),
        auth: false,
      },
    ),
  recordParticipation: (bountyId: string, transactionSignature: string) =>
    http<BountySubmission>(`/bounties/${bountyId}/participate`, {
      method: "POST",
      body: JSON.stringify({ transactionSignature }),
    }),
  submitWork: (
    bountyId: string,
    submission: {
      submissionUrl?: string;
      submissionText?: string;
      transactionSignature: string;
    },
  ) =>
    http<BountySubmission>(`/bounties/${bountyId}/submission`, {
      method: "POST",
      body: JSON.stringify(submission),
    }),
  review: (
    bountyId: string,
    submissionId: string,
    approved: boolean,
    reviewNote?: string,
    rewardTxSignature?: string,
  ) =>
    http<void>(`/bounties/${bountyId}/submissions/${submissionId}/review`, {
      method: "POST",
      body: JSON.stringify({ approved, reviewNote, rewardTxSignature }),
    }),
  actionUrl: (bountyId: string) =>
    `${env.apiUrl.replace(/\/api\/v\d+\/?$/, "")}/actions/v1/bounties/${bountyId}`,
};
