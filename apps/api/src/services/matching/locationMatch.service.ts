import type { DnaMatchInput } from "../dna/dnaBuilder.service";

export function scoreLocation(
  dna: DnaMatchInput,
  opportunity: {
    countryCode: string | null;
    city: string | null;
    region: string | null;
    isRemote: boolean;
  },
): { score: number; reason?: string; concern?: string } {
  const max = 20;

  if (opportunity.isRemote && (dna.remotePreference === "REMOTE" || dna.remotePreference === "ANY")) {
    return { score: max, reason: "Remote-friendly opportunity" };
  }

  const countryMatches =
    opportunity.countryCode && dna.preferredCountries.includes(opportunity.countryCode);

  const cityMatches =
    opportunity.city &&
    dna.preferredLocations.some((location) =>
      location.toLowerCase() === opportunity.city!.toLowerCase(),
    );

  if (cityMatches) return { score: max, reason: "Preferred city matches" };
  if (countryMatches) return { score: Math.round(max * 0.9), reason: "Preferred country matches" };

  const regionMatches =
    opportunity.region &&
    dna.preferredLocations.some((location) =>
      location.toLowerCase() === opportunity.region!.toLowerCase(),
    );
  if (regionMatches) return { score: Math.round(max * 0.75), reason: "Preferred region matches" };

  return { score: Math.round(max * 0.3), concern: "Location is outside your preferences" };
}