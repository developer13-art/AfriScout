import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";
import type { DnaCreateInput, DnaPatchInput } from "../../validators/dna.validator";

export async function getActiveDna(userId: string) {
  return prisma.dnaProfile.findFirst({
    where: { userId, isActive: true },
    orderBy: { version: "desc" },
    include: { capabilitiesRows: true },
  });
}

export async function listDnaVersions(userId: string) {
  return prisma.dnaProfile.findMany({
    where: { userId },
    orderBy: { version: "desc" },
  });
}

export async function requireActiveDna(userId: string) {
  const dna = await getActiveDna(userId);
  if (!dna) throw new NotFoundError("No active DNA profile");
  return dna;
}

export async function createDna(userId: string, input: DnaCreateInput) {
  const latest = await prisma.dnaProfile.findFirst({
    where: { userId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const nextVersion = (latest?.version ?? 0) + 1;

  await prisma.dnaProfile.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });

  return prisma.dnaProfile.create({
    data: {
      userId,
      version: nextVersion,
      isActive: true,
      industries: input.industries,
      capabilities: input.capabilities,
      sectors: input.sectors,
      preferredCountries: input.preferredCountries,
      preferredLocations: input.preferredLocations,
      remotePreference: input.remotePreference,
      currency: input.currency,
      minValue: input.minValue ?? null,
      maxValue: input.maxValue ?? null,
      eligibilityNotes: input.eligibilityNotes ?? null,
      experienceNotes: input.experienceNotes ?? null,
      opportunityTypes: input.opportunityTypes,
      opportunityCategories: input.opportunityCategories,
      keywords: input.keywords,
    },
  });
}

export async function updateActiveDna(userId: string, patch: DnaPatchInput) {
  const active = await getActiveDna(userId);
  if (!active) throw new NotFoundError("No active DNA profile");

  return prisma.dnaProfile.update({
    where: { id: active.id },
    data: {
      industries: patch.industries ?? active.industries,
      capabilities: patch.capabilities ?? active.capabilities,
      sectors: patch.sectors ?? active.sectors,
      preferredCountries: patch.preferredCountries ?? active.preferredCountries,
      preferredLocations: patch.preferredLocations ?? active.preferredLocations,
      remotePreference: (patch.remotePreference ?? active.remotePreference) as never,
      currency: patch.currency ?? active.currency,
      minValue: patch.minValue ?? active.minValue,
      maxValue: patch.maxValue ?? active.maxValue,
      eligibilityNotes: patch.eligibilityNotes ?? active.eligibilityNotes,
      experienceNotes: patch.experienceNotes ?? active.experienceNotes,
      opportunityTypes: patch.opportunityTypes ?? active.opportunityTypes,
      opportunityCategories:
        patch.opportunityCategories ?? active.opportunityCategories,
      keywords: patch.keywords ?? active.keywords,
    },
  });
}

export async function archiveActiveDna(userId: string) {
  const active = await getActiveDna(userId);
  if (!active) throw new NotFoundError("No active DNA profile");
  return prisma.dnaProfile.update({
    where: { id: active.id },
    data: { isActive: false },
  });
}