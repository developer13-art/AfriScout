import type { Opportunity } from "./opportunity";

export type BountyStatus = "OPEN" | "PAUSED" | "AWARDING" | "COMPLETED" | "CANCELLED";
export type SubmissionStatus = "PARTICIPATING" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface BountyOrganization {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
}

export interface BountySubmission {
  id: string;
  status: SubmissionStatus;
  walletAddress?: string | null;
  participationTxSignature?: string | null;
  submissionProofTxSignature?: string | null;
  rewardTxSignature?: string | null;
  submissionUrl?: string | null;
  submissionText?: string | null;
  reviewNote?: string | null;
  createdAt: string;
  participant?: { id: string; fullName: string; walletAddress?: string | null };
  achievement?: { id: string; title: string; proofHash: string; points: number } | null;
}

export interface Bounty {
  id: string;
  organizationId: string;
  opportunityId: string;
  rewardAmount: string | number;
  rewardCurrency: string;
  requiredSkills: string[];
  status: BountyStatus;
  fundingStatus: "UNFUNDED" | "PENDING" | "FUNDED" | "DISPUTED";
  fundingTxSignature?: string | null;
  organization: BountyOrganization;
  opportunity: Opportunity;
  _count?: { submissions: number };
  submissions?: BountySubmission[];
}

export interface BountyPassport {
  walletAddress?: string | null;
  walletVerifiedAt?: string | null;
  reputationScore: number;
  verifiedAchievementCount: number;
  anchoredAchievementCount: number;
  onChainParticipationCount: number;
  onChainSubmissionCount: number;
  completedOpportunityCount: number;
  paidRewardCount: number;
  skills: string[];
  certifications: string[];
  achievements: Array<{
    id: string;
    title: string;
    description?: string | null;
    proofHash: string;
    proofTxSignature?: string | null;
    proofWalletAddress?: string | null;
    proofAnchoredAt?: string | null;
    points: number;
    issuedAt: string;
    issuer: { id: string; fullName: string };
    organization: { id: string; name: string; slug: string };
    opportunity: { id: string; title: string; slug: string };
    submission: {
      participationTxSignature?: string | null;
      submissionProofTxSignature?: string | null;
      rewardTxSignature?: string | null;
      walletAddress?: string | null;
    };
  }>;
}
