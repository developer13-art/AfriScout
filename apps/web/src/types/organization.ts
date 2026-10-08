export type OrganizationType =
  | "GOVERNMENT"
  | "PRIVATE"
  | "NGO"
  | "FOUNDATION"
  | "UNIVERSITY"
  | "DEVELOPMENT"
  | "ACCELERATOR"
  | "INCUBATOR"
  | "OTHER";

export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type?: OrganizationType | null;
  countryCode?: string | null;
  website?: string | null;
  description?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  logoUrl?: string | null;
  membershipRole?: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: string;
}

export interface PublicOrganizationProfile extends Organization {
  publishedOpportunityCount: number;
  completedBountyCount: number;
  directPayoutCount: number;
  fundingTransactionReferenceCount: number;
  opportunities: Array<{
    id: string;
    slug: string;
    title: string;
    summaryShort?: string | null;
    category: string;
    opportunityType: string;
    deadline?: string | null;
    bounty?: {
      id: string;
      status: string;
      rewardAmount: string | number;
      rewardCurrency: string;
      fundingStatus: string;
      fundingTxSignature?: string | null;
    } | null;
  }>;
}