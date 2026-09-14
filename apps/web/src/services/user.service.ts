import { http } from "./http";
import type { User, UserProfile } from "../types/user";
import type { BusinessProfile } from "../types/business";
import type { StudentProfile } from "../types/student";

export const userService = {
  me: () => http<User>("/users/me"),

  updateMe: (patch: Partial<Pick<User, "fullName" | "phone" | "countryCode" | "avatarUrl">>) =>
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
};