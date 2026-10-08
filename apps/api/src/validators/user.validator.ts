import { z } from "zod";

const userTypeSchema = z.enum([
  "BUSINESS",
  "PROFESSIONAL",
  "STUDENT",
  "RESEARCHER",
  "NGO",
  "STARTUP",
  "OTHER",
]);

const remotePreferenceSchema = z.enum(["ONSITE", "REMOTE", "HYBRID", "ANY"]);
const workspaceTypeSchema = z.enum(["PERSONAL", "ORGANIZATION", "DEVELOPER"]);

export const updateMeSchema = z.object({
  fullName: z.string().trim().min(2).max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(120).optional(),
  countryCode: z.string().trim().length(2).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const updateProfileSchema = z.object({
  username: z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9_]+$/).optional(),
  userType: userTypeSchema.optional(),
  workspaceIntent: workspaceTypeSchema.optional(),
  professionalIdentities: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  headline: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(4000).optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  timezone: z.string().trim().max(64).optional(),
  preferredCurrency: z.string().trim().length(3).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const saveCompleteProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(200).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  countryCode: z.string().trim().length(2).nullable().optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
  username: z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9_]+$/).nullable().optional(),
  userType: userTypeSchema.optional(),
  workspaceIntent: workspaceTypeSchema.optional(),
  professionalIdentities: z.array(z.string().trim().min(1).max(60)).max(12).optional(),
  headline: z.string().trim().max(200).nullable().optional(),
  bio: z.string().trim().max(4000).nullable().optional(),
  languages: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  industries: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  interests: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
  timezone: z.string().trim().max(64).nullable().optional(),
  preferredCurrency: z.string().trim().length(3).nullable().optional(),
  coverImageUrl: z.string().url().max(500).nullable().optional(),
  profession: z.string().trim().max(120).nullable().optional(),
  seniority: z.string().trim().max(80).nullable().optional(),
  yearsExperience: z.number().int().min(0).max(80).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  certifications: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  portfolioUrl: z.string().url().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  educationLevel: z.string().trim().max(120).nullable().optional(),
  fieldOfStudy: z.string().trim().max(120).nullable().optional(),
  institution: z.string().trim().max(200).nullable().optional(),
  graduationYear: z.number().int().min(1950).max(2100).nullable().optional(),
}).strict().refine((input) => Object.keys(input).length > 0, "Provide at least one profile field to save");

export const updateBusinessProfileSchema = z.object({
  companyName: z.string().trim().min(2).max(200).optional(),
  registrationNumber: z.string().trim().max(80).optional(),
  industry: z.string().trim().max(120).optional(),
  employeesCount: z.coerce.number().int().nonnegative().optional(),
  annualRevenue: z.coerce.number().nonnegative().optional(),
  annualRevenueCurrency: z.string().trim().length(3).optional(),
  website: z.string().url().optional(),
  description: z.string().trim().max(4000).optional(),
});

export const updateStudentProfileSchema = z.object({
  educationLevel: z.string().trim().max(120).optional(),
  fieldOfStudy: z.string().trim().max(120).optional(),
  institution: z.string().trim().max(200).optional(),
  graduationYear: z.coerce.number().int().min(1950).max(2100).optional(),
  interests: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
});

export const updateProfessionalProfileSchema = z.object({
  profession: z.string().trim().max(120).optional(),
  seniority: z.string().trim().max(80).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  certifications: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  portfolioUrl: z.string().url().optional(),
  linkedinUrl: z.string().url().optional(),
});

export const dnaDraftSchema = z.object({
  industries: z.array(z.string().trim().min(1).max(120)).max(50),
  capabilities: z.array(z.string().trim().min(1).max(120)).max(100),
  sectors: z.array(z.string().trim().min(1).max(120)).max(50),
  preferredCountries: z.array(z.string().trim().length(2)).max(60),
  preferredLocations: z.array(z.string().trim().min(1).max(120)).max(100),
  remotePreference: remotePreferenceSchema,
  currency: z.string().trim().length(3),
  minValue: z.number().nonnegative().nullable().optional(),
  maxValue: z.number().nonnegative().nullable().optional(),
  eligibilityNotes: z.string().trim().max(4000).optional(),
  experienceNotes: z.string().trim().max(4000).optional(),
  opportunityTypes: z.array(z.string().trim().min(1).max(60)).max(50),
  opportunityCategories: z.array(z.string().trim().min(1).max(60)).max(50),
  keywords: z.array(z.string().trim().min(1).max(60)).max(100),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  role: z.string().trim().optional(),
  status: z.string().trim().optional(),
  q: z.string().trim().max(200).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["SUPER_ADMIN", "DATA_ADMIN", "USER", "API_DEVELOPER"]),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "DELETED"]),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SaveCompleteProfileInput = z.infer<typeof saveCompleteProfileSchema>;
export type UpdateBusinessProfileInput = z.infer<typeof updateBusinessProfileSchema>;
export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;
export type UpdateProfessionalProfileInput = z.infer<typeof updateProfessionalProfileSchema>;
export type DnaDraftInput = z.infer<typeof dnaDraftSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;