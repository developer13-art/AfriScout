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