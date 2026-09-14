import type { DnaProfile } from "@prisma/client";

export interface DnaMatchInput {
  industries: string[];
  capabilities: string[];
  sectors: string[];
  preferredCountries: string[];
  preferredLocations: string[];
  remotePreference: string | null;
  currency: string | null;
  minValue: number | null;
  maxValue: number | null;
  opportunityTypes: string[];
  opportunityCategories: string[];
  keywords: string[];
}

export function toDnaMatchInput(dna: DnaProfile): DnaMatchInput {
  return {
    industries: dna.industries,
    capabilities: dna.capabilities,
    sectors: dna.sectors,
    preferredCountries: dna.preferredCountries,
    preferredLocations: dna.preferredLocations,
    remotePreference: dna.remotePreference,
    currency: dna.currency,
    minValue: dna.minValue ? Number(dna.minValue) : null,
    maxValue: dna.maxValue ? Number(dna.maxValue) : null,
    opportunityTypes: dna.opportunityTypes,
    opportunityCategories: dna.opportunityCategories,
    keywords: dna.keywords,
  };
}

export function mergeDnaIntoKeywords(dna: DnaMatchInput): string[] {
  return Array.from(
    new Set([
      ...dna.industries,
      ...dna.capabilities,
      ...dna.sectors,
      ...dna.opportunityTypes,
      ...dna.opportunityCategories,
      ...dna.keywords,
    ]),
  );
}