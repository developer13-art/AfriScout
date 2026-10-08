import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export async function getBusinessProfile(userId: string) {
  return prisma.businessProfile.findUnique({ where: { userId } });
}

export async function upsertBusinessProfile(
  userId: string,
  patch: {
    companyName?: string;
    registrationNumber?: string;
    industry?: string;
    employeesCount?: number;
    annualRevenue?: number;
    annualRevenueCurrency?: string;
    website?: string;
    description?: string;
  },
) {
  if (!patch.companyName) {
    const existing = await getBusinessProfile(userId);
    if (!existing) throw new NotFoundError("Company name is required to create a business profile");
  }

  const current = await prisma.businessProfile.findUnique({ where: { userId } });

  if (!current) {
    return prisma.businessProfile.create({
      data: {
        userId,
        companyName: patch.companyName ?? "Untitled",
        registrationNumber: patch.registrationNumber ?? null,
        industry: patch.industry ?? null,
        employeesCount: patch.employeesCount ?? null,
        annualRevenue: patch.annualRevenue ?? null,
        annualRevenueCurrency: patch.annualRevenueCurrency ?? null,
        website: patch.website ?? null,
        description: patch.description ?? null,
      },
    });
  }

  return prisma.businessProfile.update({
    where: { userId },
    data: {
      companyName: patch.companyName ?? current.companyName,
      registrationNumber: patch.registrationNumber ?? current.registrationNumber,
      industry: patch.industry ?? current.industry,
      employeesCount: patch.employeesCount ?? current.employeesCount,
      annualRevenue: patch.annualRevenue ?? current.annualRevenue,
      annualRevenueCurrency:
        patch.annualRevenueCurrency ?? current.annualRevenueCurrency,
      website: patch.website ?? current.website,
      description: patch.description ?? current.description,
    },
  });
}