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
  industries?: string[];
  interests?: string[];
  coverImageUrl?: string | null;
  timezone?: string | null;
  preferredCurrency?: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  profession: string | null;
  seniority: string | null;
  yearsExperience: number | null;
  skills: string[];
  certifications: string[];
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteUserProfile {
  user: Pick<User, "id" | "fullName" | "phone" | "city" | "countryCode" | "avatarUrl">;
  profile: UserProfile | null;
  professionalProfile: ProfessionalProfile | null;
  studentProfile: {
    id: string;
    userId: string;
    educationLevel: string | null;
    fieldOfStudy: string | null;
    institution: string | null;
    graduationYear: number | null;
    interests: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface CompleteUserProfilePatch {
  fullName?: string;
  phone?: string | null;
  city?: string | null;
  countryCode?: string | null;
  avatarUrl?: string | null;
  username?: string | null;
  userType?: UserType;
  workspaceIntent?: WorkspaceIntent;
  professionalIdentities?: string[];
  headline?: string | null;
  bio?: string | null;
  languages?: string[];
  industries?: string[];
  interests?: string[];
  timezone?: string | null;
  preferredCurrency?: string | null;
  coverImageUrl?: string | null;
  profession?: string | null;
  seniority?: string | null;
  yearsExperience?: number | null;
  skills?: string[];
  certifications?: string[];
  portfolioUrl?: string | null;
  linkedinUrl?: string | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  institution?: string | null;
  graduationYear?: number | null;
}

export interface Session {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: string;
  createdAt: string;
}