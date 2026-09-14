import type { OpportunityCategory } from "./opportunity";

export type RemotePreference = "ONSITE" | "REMOTE" | "HYBRID" | "ANY";

export interface DnaProfile {
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
  opportunityCategories: OpportunityCategory[];
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DnaCapability {
  id: string;
  dnaProfileId: string;
  capability: string;
  strength?: number | null;
  createdAt: string;
}

export interface DnaDraft {
  industries: string[];
  capabilities: string[];
  sectors: string[];
  preferredCountries: string[];
  preferredLocations: string[];
  remotePreference: RemotePreference;
  currency: string;
  minValue?: number | null;
  maxValue?: number | null;
  eligibilityNotes?: string;
  experienceNotes?: string;
  opportunityTypes: string[];
  opportunityCategories: OpportunityCategory[];
  keywords: string[];
}