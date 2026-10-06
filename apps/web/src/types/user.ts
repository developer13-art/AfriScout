export type UserRole = "SUPER_ADMIN" | "DATA_ADMIN" | "USER" | "API_DEVELOPER";

export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "DELETED";

export type UserType =
  | "BUSINESS"
  | "PROFESSIONAL"
  | "STUDENT"
  | "RESEARCHER"
  | "NGO"
  | "STARTUP"
  | "OTHER";

export type WorkspaceIntent = "PERSONAL" | "ORGANIZATION" | "DEVELOPER";

export interface User {
  id: string;
  email: string | null;
  walletAddress?: string | null;
  walletVerifiedAt?: string | null;
  fullName: string;
  phone?: string | null;
  city?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt?: string | null;
  lastLoginAt?: string | null;
  onboardingCompleted?: boolean;
  workspaceIntent?: WorkspaceIntent | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  username?: string | null;
  userType: UserType;
  workspaceIntent: WorkspaceIntent;
  professionalIdentities: string[];
  headline?: string | null;
  bio?: string | null;
  languages: string[];
  timezone?: string | null;
  preferredCurrency?: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: string;
  createdAt: string;
}