import type { OpportunityCategoryKey } from "../constants/opportunityCategories";

export type RemotePreference = "ONSITE" | "REMOTE" | "HYBRID" | "ANY";

export interface DnaProfileDTO {
  id: string;
  userId: string;
  version: number;
  isActive: boolean;
  industries: string[];
  capabilities: string[];
  sectors: string[];
  preferredCountries: string[];
  preferredLocations: string[];
  remotePreference?: RemotePreference | null;
  currency?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  eligibilityNotes?: string | null;
  experienceNotes?: string | null;
  opportunityTypes: string[];
  opportunityCategories: OpportunityCategoryKey[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DnaDraftDTO {
  industries: string[];
  capabilities: string[];
  sectors: string[];
  preferredCountries: string[];
  preferredLocations: string[];
  remotePreference: RemotePreference;
  currency: string;
  minValue?: number | null;
  maxValue?: number | null;
  eligibilityNotes?: string | null;
  experienceNotes?: string | null;
  opportunityTypes: string[];
  opportunityCategories: OpportunityCategoryKey[];
  keywords: string[];
}