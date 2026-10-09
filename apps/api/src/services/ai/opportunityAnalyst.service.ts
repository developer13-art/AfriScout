import { z } from "zod";
import { prisma } from "../../config/database";
import { runAi } from "./ai.service";
import type { NormalizedOpportunity } from "../../types/opportunity";

const opportunityAnalysisSchema = z.object({
  summary: z.string().min(1).max(5000),
  eligibility: z.enum(["LIKELY", "POSSIBLE_GAPS", "UNLIKELY", "INSUFFICIENT_EVIDENCE"]),
  eligibilityReason: z.string().min(1).max(2000),
  requirements: z.array(z.string().min(1).max(1000)).max(30),
  skills: z.array(z.string().min(1).max(500)).max(30),
  risks: z.array(z.string().min(1).max(1000)).max(20),
  recommendations: z.array(z.string().min(1).max(1000)).max(20),
  confidence: z.number().min(0).max(1),
});

const PROMPT_VERSION = "opportunity-intelligence.v1";

export interface OpportunityAnalysisResult {
  summary: string;
  eligibility: z.infer<typeof opportunityAnalysisSchema>["eligibility"];
  eligibilityReason: string;
  requirements: string[];
  skills: string[];
  risks: string[];
  recommendations: string[];
  confidence: number;
  provider: string;
  model: string;
  analyzedAt: string;
}

export function parseOpportunityAnalysisOutput(output: unknown): z.infer<typeof opportunityAnalysisSchema> {
  return opportunityAnalysisSchema.parse(output);
}

export async function analyzeOpportunity(
  opportunityId: string,
  opportunity: NormalizedOpportunity,
): Promise<OpportunityAnalysisResult> {
  const result = await runAi({
    taskType: "ANALYST",
    promptVersion: PROMPT_VERSION,
    systemPrompt:
      "You are Scout's evidence-based opportunity intelligence analyst. Use only the supplied opportunity data. Never invent eligibility, skills, requirements, deadlines, funding, or source facts. Distinguish source claims from AI interpretation and report uncertainty explicitly.",
    userPrompt: buildAnalysisPrompt(opportunity),
    responseFormat: "json",
    opportunityId,
    validateOutput: parseOpportunityAnalysisOutput,
    temperature: 0.1,
    maxTokens: 6000,
  });

  const parsed = parseOpportunityAnalysisOutput(result.output);
  const analyzedAt = new Date().toISOString();
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      systemState: "ANALYZED",
      aiProcessed: true,
      aiProcessedAt: new Date(analyzedAt),
    },
  });

  const analysis: OpportunityAnalysisResult = {
    summary: parsed.summary,
    eligibility: parsed.eligibility,
    eligibilityReason: parsed.eligibilityReason,
    requirements: parsed.requirements,
    skills: parsed.skills,
    risks: parsed.risks,
    recommendations: parsed.recommendations,
    confidence: parsed.confidence,
    provider: result.provider,
    model: result.model,
    analyzedAt,
  };
  return analysis;
}

function buildAnalysisPrompt(opportunity: NormalizedOpportunity): string {
  return [
    "Analyze this opportunity as evidence-based Scout intelligence.",
    "Return strict JSON with exactly these fields: summary, eligibility, eligibilityReason, requirements, skills, risks, recommendations, confidence.",
    "Eligibility values: LIKELY, POSSIBLE_GAPS, UNLIKELY, INSUFFICIENT_EVIDENCE.",
    "confidence is a number from 0 to 1 reflecting evidence quality, not certainty.",
    "Do not infer facts absent from the supplied fields. Treat sourceUrl and raw as provenance, not as proof.",
    JSON.stringify({
      title: opportunity.title,
      organizationName: opportunity.organizationName,
      category: opportunity.category,
      opportunityType: opportunity.opportunityType,
      countryCode: opportunity.countryCode,
      region: opportunity.region,
      city: opportunity.city,
      locationText: opportunity.locationText,
      isRemote: opportunity.isRemote,
      description: opportunity.description,
      summaryShort: opportunity.summaryShort,
      valueMin: opportunity.valueMin,
      valueMax: opportunity.valueMax,
      currency: opportunity.currency,
      publishedAt: opportunity.publishedAt,
      deadline: opportunity.deadline,
      eligibility: opportunity.eligibility,
      requirements: opportunity.requirements,
      applicationMethod: opportunity.applicationMethod,
      applicationUrl: opportunity.applicationUrl,
      referenceNumber: opportunity.referenceNumber,
      sourceUrl: opportunity.sourceUrl,
      sourceId: opportunity.sourceId,
      raw: opportunity.extra?.raw,
    }),
  ].join("\n\n");
}
