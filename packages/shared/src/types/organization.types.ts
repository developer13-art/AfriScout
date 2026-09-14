export type OrganizationTypeKey =
  | "GOVERNMENT"
  | "PRIVATE"
  | "NGO"
  | "FOUNDATION"
  | "UNIVERSITY"
  | "DEVELOPMENT"
  | "ACCELERATOR"
  | "INCUBATOR"
  | "OTHER";

export type OrganizationRoleKey = "OWNER" | "ADMIN" | "MEMBER";

export interface OrganizationDTO {
  id: string;
  name: string;
  slug: string;
  type?: OrganizationTypeKey | null;
  countryCode?: string | null;
  website?: string | null;
  description?: string | null;
  verified: boolean;
  verifiedAt?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMemberDTO {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRoleKey;
  createdAt: string;
}