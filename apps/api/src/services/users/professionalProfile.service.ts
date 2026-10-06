import { prisma } from "../../config/database";

export async function getProfessionalProfile(userId: string) {
  return prisma.professionalProfile.findUnique({ where: { userId } });
}

export async function upsertProfessionalProfile(
  userId: string,
  patch: {
    profession?: string;
    seniority?: string;
    yearsExperience?: number;
    skills?: string[];
    certifications?: string[];
    portfolioUrl?: string;
    linkedinUrl?: string;
  },
) {
  const current = await prisma.professionalProfile.findUnique({ where: { userId } });

  if (!current) {
    return prisma.professionalProfile.create({
      data: {
        userId,
        profession: patch.profession ?? null,
        seniority: patch.seniority ?? null,
        yearsExperience: patch.yearsExperience ?? null,
        skills: patch.skills ?? [],
        certifications: patch.certifications ?? [],
        portfolioUrl: patch.portfolioUrl ?? null,
        linkedinUrl: patch.linkedinUrl ?? null,
      },
    });
  }

  return prisma.professionalProfile.update({
    where: { userId },
    data: {
      profession: patch.profession ?? current.profession,
      seniority: patch.seniority ?? current.seniority,
      yearsExperience: patch.yearsExperience ?? current.yearsExperience,
      skills: patch.skills ?? current.skills,
      certifications: patch.certifications ?? current.certifications,
      portfolioUrl: patch.portfolioUrl ?? current.portfolioUrl,
      linkedinUrl: patch.linkedinUrl ?? current.linkedinUrl,
    },
  });
}