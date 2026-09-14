import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z.string().min(8).max(128);

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().trim().min(2).max(200),
  countryCode: z.string().trim().length(2).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });
export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: passwordSchema,
});
export const verifyEmailSchema = z.object({ token: z.string().min(10) });
export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  fullName: z.string().trim().min(2).max(200),
  password: passwordSchema,
});