import { http } from "./http";
import type { User, UserProfile } from "../types/user";
import type { BusinessProfile } from "../types/business";
import type { StudentProfile } from "../types/student";
import type { BountyPassport } from "../types/bounty";

export const userService = {
  me: () => http<User>("/users/me"),
  passport: () => http<BountyPassport>("/users/me/passport"),

  achievementProofTransaction: (achievementId: string, account: string) =>
    http<{ transaction: string }>(
      `/users/me/achievements/${achievementId}/proof-transaction`,
      { method: "POST", body: JSON.stringify({ account }) },
    ),

  confirmAchievementProof: (achievementId: string, transactionSignature: string) =>
    http<BountyPassport["achievements"][number]>(
      `/users/me/achievements/${achievementId}/proof-confirm`,
      { method: "POST", body: JSON.stringify({ transactionSignature }) },
    ),

  updateMe: (patch: Partial<Pick<User, "fullName" | "phone" | "city" | "countryCode" | "avatarUrl">>) =>
    http<User>("/users/me", { method: "PATCH", body: JSON.stringify(patch) }),

  getProfile: () => http<UserProfile>("/users/me/profile"),

  updateProfile: (patch: Partial<UserProfile>) =>
    http<UserProfile>("/users/me/profile", { method: "PATCH", body: JSON.stringify(patch) }),

  getBusinessProfile: () => http<BusinessProfile>("/users/me/business"),

  updateBusinessProfile: (patch: Partial<BusinessProfile>) =>
    http<BusinessProfile>("/users/me/business", { method: "PATCH", body: JSON.stringify(patch) }),

  getStudentProfile: () => http<StudentProfile>("/users/me/student"),

  updateStudentProfile: (patch: Partial<StudentProfile>) =>
    http<StudentProfile>("/users/me/student", { method: "PATCH", body: JSON.stringify(patch) }),

  getProfessionalProfile: () => http<{
    profession?: string | null;
    skills: string[];
    certifications: string[];
  } | null>("/users/me/professional"),

  updateProfessionalProfile: (patch: {
    profession?: string;
    skills?: string[];
    certifications?: string[];
  }) => http("/users/me/professional", { method: "PATCH", body: JSON.stringify(patch) }),
};