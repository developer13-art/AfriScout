import { prisma } from "../../config/database";
import { ConflictError, NotFoundError } from "../../utils/errors";
import type { RoleKey } from "../../constants/roles";
import type { SaveCompleteProfileInput, UpdateMeInput, UpdateProfileInput } from "../../validators/user.validator";
import { ensureMatchesForUser } from "../matching/batchMatch.service";

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      walletAddress: true,
      walletVerifiedAt: true,
      fullName: true,
      phone: true,
      city: true,
      countryCode: true,
      avatarUrl: true,
      role: true,
      status: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      profile: {
        select: {
          onboardingCompleted: true,
          workspaceIntent: true,
        },
      },
      dnaProfiles: {
        where: { isActive: true },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!user) return null;
  const { profile, dnaProfiles, ...identity } = user;
  return {
    ...identity,
    onboardingCompleted: Boolean(profile?.onboardingCompleted || dnaProfiles.length),
    workspaceIntent: profile?.workspaceIntent ?? null,
  };
}

export async function requireUserById(id: string) {
  const user = await findUserById(id);
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function listUsers(input: {
  page: number;
  pageSize: number;
  q?: string;
  role?: RoleKey;
  status?: string;
}) {
  const where: Record<string, unknown> = {};
  if (input.q) {
    where.OR = [
      { email: { contains: input.q, mode: "insensitive" } },
      { fullName: { contains: input.q, mode: "insensitive" } },
    ];
  }
  if (input.role) where.role = input.role;
  if (input.status) where.status = input.status;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: {
        id: true,
        email: true,
        walletAddress: true,
        fullName: true,
        role: true,
        status: true,
        countryCode: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total };
}

export async function updateUser(
  userId: string,
  patch: UpdateMeInput,
) {
  await requireUserById(userId);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: patch.fullName,
      phone: patch.phone,
      city: patch.city,
      countryCode: patch.countryCode,
      avatarUrl: patch.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      walletAddress: true,
      fullName: true,
      phone: true,
      city: true,
      countryCode: true,
      avatarUrl: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });
  await ensureMatchesForUser(userId, true);
  return updated;
}

export async function findUserProfile(userId: string) {
  return prisma.userProfile.findUnique({ where: { userId } });
}

export async function updateUserProfile(userId: string, patch: UpdateProfileInput) {
  try {
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        userType: patch.userType ?? "OTHER",
        ...patch,
        username: patch.username?.toLowerCase(),
      },
      update: {
        ...patch,
        username: patch.username?.toLowerCase(),
      },
    });
    await ensureMatchesForUser(userId, true);
    return profile;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ConflictError("That username is already in use");
    }
    throw error;
  }
}

export async function getCompleteProfile(userId: string) {
  const [user, profile, professionalProfile, studentProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, phone: true, city: true, countryCode: true, avatarUrl: true },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.professionalProfile.findUnique({ where: { userId } }),
    prisma.studentProfile.findUnique({ where: { userId } }),
  ]);
  if (!user) throw new NotFoundError("User not found");
  return { user, profile, professionalProfile, studentProfile };
}

export async function saveCompleteProfile(userId: string, patch: SaveCompleteProfileInput) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          fullName: patch.fullName,
          phone: patch.phone,
          city: patch.city,
          countryCode: patch.countryCode,
          avatarUrl: patch.avatarUrl,
        },
        select: { id: true, fullName: true, phone: true, city: true, countryCode: true, avatarUrl: true },
      });

      const profileData = {
        username: patch.username === undefined ? undefined : patch.username?.toLowerCase() ?? null,
        userType: patch.userType,
        workspaceIntent: patch.workspaceIntent,
        professionalIdentities: patch.professionalIdentities,
        headline: patch.headline,
        bio: patch.bio,
        languages: patch.languages,
        industries: patch.industries,
        interests: patch.interests,
        timezone: patch.timezone,
        preferredCurrency: patch.preferredCurrency,
        coverImageUrl: patch.coverImageUrl,
      };
      const profile = await tx.userProfile.upsert({
        where: { userId },
        create: { userId, ...profileData, userType: patch.userType ?? "OTHER" },
        update: profileData,
      });

      const hasProfessionalDetails = [
        patch.profession,
        patch.seniority,
        patch.yearsExperience,
        patch.skills,
        patch.certifications,
        patch.portfolioUrl,
        patch.linkedinUrl,
      ].some((value) => value !== undefined);
      const professionalProfile = hasProfessionalDetails
        ? await tx.professionalProfile.upsert({
            where: { userId },
            create: {
              userId,
              profession: patch.profession ?? null,
              seniority: patch.seniority ?? null,
              yearsExperience: patch.yearsExperience ?? null,
              skills: patch.skills ?? [],
              certifications: patch.certifications ?? [],
              portfolioUrl: patch.portfolioUrl ?? null,
              linkedinUrl: patch.linkedinUrl ?? null,
            },
            update: {
              profession: patch.profession,
              seniority: patch.seniority,
              yearsExperience: patch.yearsExperience,
              skills: patch.skills,
              certifications: patch.certifications,
              portfolioUrl: patch.portfolioUrl,
              linkedinUrl: patch.linkedinUrl,
            },
          })
        : null;

      const hasStudentDetails = [
        patch.educationLevel,
        patch.fieldOfStudy,
        patch.institution,
        patch.graduationYear,
        patch.interests,
      ].some((value) => value !== undefined);
      const studentProfile = hasStudentDetails
        ? await tx.studentProfile.upsert({
            where: { userId },
            create: {
              userId,
              educationLevel: patch.educationLevel ?? null,
              fieldOfStudy: patch.fieldOfStudy ?? null,
              institution: patch.institution ?? null,
              graduationYear: patch.graduationYear ?? null,
              interests: patch.interests ?? [],
            },
            update: {
              educationLevel: patch.educationLevel,
              fieldOfStudy: patch.fieldOfStudy,
              institution: patch.institution,
              graduationYear: patch.graduationYear,
              interests: patch.interests,
            },
          })
        : null;

      return { user, profile, professionalProfile, studentProfile };
    });
    await ensureMatchesForUser(userId, true);
    return result;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new ConflictError("That username is already in use");
    }
    throw error;
  }
}

export async function requestMatchReanalysis(userId: string) {
  return ensureMatchesForUser(userId, true);
}

export async function updateUserRole(userId: string, role: RoleKey) {
  await requireUserById(userId);
  return prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true },
  });
}

export async function updateUserStatus(userId: string, status: string) {
  await requireUserById(userId);
  return prisma.user.update({
    where: { id: userId },
    data: { status: status as never },
    select: { id: true, email: true, status: true },
  });
}