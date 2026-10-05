import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2, "Full name is required").max(200),
  countryCode: z.string().trim().length(2).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, "Refresh token is required"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10, "Reset token is required"),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10, "Verification token is required"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  fullName: z.string().trim().min(2).max(200),
  password: passwordSchema,
});

const solanaAddressSchema = z.string().trim().min(32).max(44).regex(/^[1-9A-HJ-NP-Za-km-z]+$/);

export const walletChallengeSchema = z.object({
  walletAddress: solanaAddressSchema,
});

export const walletVerifySchema = z.object({
  walletAddress: solanaAddressSchema,
  nonce: z.string().min(20).max(80),
  signature: z.string().min(80).max(100).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  fullName: z.string().trim().min(2).max(200).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;