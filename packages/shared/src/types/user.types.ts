import type { RoleKey } from "../constants/roles";
import type { UserType } from "../enums/userType.enum";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "DELETED";

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
  role: RoleKey;
  status: UserStatus;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileDTO {
  id: string;
  userId: string;
  userType: UserType;
  headline?: string | null;
  bio?: string | null;
  languages: string[];
  timezone?: string | null;
  preferredCurrency?: string | null;
  onboardingCompleted: boolean;
}