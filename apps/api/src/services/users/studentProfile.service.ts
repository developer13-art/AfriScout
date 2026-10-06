import { prisma } from "../../config/database";

export async function getStudentProfile(userId: string) {
  return prisma.studentProfile.findUnique({ where: { userId } });
}

export async function upsertStudentProfile(
  userId: string,
  patch: {
    educationLevel?: string;
    fieldOfStudy?: string;
    institution?: string;
    graduationYear?: number;
    interests?: string[];
  },
) {
  const current = await prisma.studentProfile.findUnique({ where: { userId } });

  if (!current) {
    return prisma.studentProfile.create({
      data: {
        userId,
        educationLevel: patch.educationLevel ?? null,
        fieldOfStudy: patch.fieldOfStudy ?? null,
        institution: patch.institution ?? null,
        graduationYear: patch.graduationYear ?? null,
        interests: patch.interests ?? [],
      },
    });
  }

  return prisma.studentProfile.update({
    where: { userId },
    data: {
      educationLevel: patch.educationLevel ?? current.educationLevel,
      fieldOfStudy: patch.fieldOfStudy ?? current.fieldOfStudy,
      institution: patch.institution ?? current.institution,
      graduationYear: patch.graduationYear ?? current.graduationYear,
      interests: patch.interests ?? current.interests,
    },
  });
}