import { z } from "zod";

const uuid = z.string().uuid();

export const createBountySchema = z.object({
  organizationId: uuid,
  title: z.string().trim().min(5).max(240),
  description: z.string().trim().min(30).max(12000),
  rewardAmount: z.coerce.number().positive().max(1_000_000),
  rewardCurrency: z.literal("SOL"),
  requiredSkills: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  deadline: z.string().datetime().optional(),
});

export const bountyIdParamSchema = z.object({ bountyId: uuid });

export const bountySlugParamSchema = z.object({
  slug: z.string().trim().min(1).max(240),
});

export const achievementProofParamSchema = z.object({
  achievementId: uuid,
});

export const proofSignatureSchema = z.object({
  transactionSignature: z.string().trim().min(80).max(100).regex(/^[1-9A-HJ-NP-Za-km-z]+$/),
});

export const actionAccountSchema = z.object({
  account: z.string().trim().min(32).max(44).regex(/^[1-9A-HJ-NP-Za-km-z]+$/),
});

export const participationSchema = z.object({
  transactionSignature: z.string().trim().min(80).max(100).regex(/^[1-9A-HJ-NP-Za-km-z]+$/),
});

export const submissionSchema = z.object({
  submissionUrl: z.string().trim().url().max(2048).optional(),
  submissionText: z.string().trim().min(20).max(12000).optional(),
}).refine(
  (value) => Boolean(value.submissionUrl || value.submissionText),
  "Provide a link or describe the submitted work",
);

export const reviewSubmissionSchema = z.object({
  approved: z.boolean(),
  reviewNote: z.string().trim().max(2000).optional(),
  rewardTxSignature: z
    .string()
    .trim()
    .min(80)
    .max(100)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/)
    .optional(),
}).refine((value) => value.approved || !value.rewardTxSignature, {
  message: "A reward transaction is only valid when approving a submission",
  path: ["rewardTxSignature"],
});

