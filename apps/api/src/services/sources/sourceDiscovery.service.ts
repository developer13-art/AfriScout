import { createHash } from "node:crypto";
import { Prisma, type SourceType, type SuggestionStatus } from "@prisma/client";
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import { ConflictError, InternalError, NotFoundError, ValidationError } from "../../utils/errors";
import { ensureUniqueSlug, slugify } from "../../utils/slugify";
import type { SourceCandidateReviewInput } from "../../validators/sourceDiscovery.validator";
import { discoverWebSearchResults } from "./sourceDiscoverySearch.service";
import {
  assessSearchResults,
  buildDiscoveryQueries,
  canonicalCategory,
  getHost,
  nameSimilarity,
  normalizedCandidateUrl,
  type CandidateAssessment,
  type DiscoverySearchResult,
} from "./sourceDiscoveryAnalysis.service";

type SuggestionMetadata = Record<string, unknown>;
type CreateSourceDiscoveryRunInput = {
  scope: string;
  countries: string[];
  categories: string[];
  sourceTypes: string[];
  minimumScore: number;
};

export async function createRun(input: CreateSourceDiscoveryRunInput, requestedBy: string) {
  const queries = buildDiscoveryQueries(input);
  if (queries.length === 0) throw new ValidationError("At least one search strategy is required");

  const run = await prisma.sourceDiscoveryRun.create({
    data: {
      requestedBy,
      actorId: "native-web-search",
      status: "QUEUED",
      scope: input.scope,
      countries: input.countries,
      categories: input.categories,
      sourceTypes: input.sourceTypes,
      minimumScore: input.minimumScore,
      queries: queries as Prisma.InputJsonValue,
    },
  });

  try {
    await prisma.sourceDiscoveryRun.update({ where: { id: run.id }, data: { status: "RUNNING" } });
    const searchResults = (await discoverWebSearchResults(queries)).map((result, index) => ({
      ...result,
      id: `candidate-${index + 1}`,
    }));
    await prisma.sourceDiscoveryRun.update({ where: { id: run.id }, data: { status: "ANALYZING" } });
    const assessments = await assessSearchResults(searchResults);
    const stored = await persistCandidates(run, searchResults, assessments);
    return await prisma.sourceDiscoveryRun.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        resultCount: stored,
        processedAt: new Date(),
        errorMessage: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Native source discovery failed";
    await prisma.sourceDiscoveryRun.update({
      where: { id: run.id },
      data: { status: "FAILED", errorMessage: message, processedAt: new Date() },
    });
    logger.error({ err: error, discoveryRunId: run.id }, "source_discovery_failed");
    throw error;
  }
}

export async function getOverview() {
  await failLegacyApifyRuns();
  const [sourcesDiscovered, pendingReview, approved, runs, candidates] = await Promise.all([
    prisma.sourceSuggestion.count({ where: { sourceDiscoveryRunId: { not: null } } }),
    prisma.sourceSuggestion.count({
      where: { sourceDiscoveryRunId: { not: null }, status: "SUGGESTED" },
    }),
    prisma.sourceSuggestion.findMany({
      where: {
        sourceDiscoveryRunId: { not: null },
        status: { in: ["APPROVED", "VERIFIED", "ACTIVATED"] },
      },
      select: { id: true, metadata: true },
    }),
    prisma.sourceDiscoveryRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.sourceSuggestion.findMany({
      where: { sourceDiscoveryRunId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const approvedSourceIds = approved
    .map((candidate) => metadataRecord(candidate.metadata).approvedSourceId)
    .filter((id): id is string => typeof id === "string");
  const sourceRows = approvedSourceIds.length
    ? await prisma.source.findMany({
        where: { id: { in: approvedSourceIds } },
        select: { id: true, active: true },
      })
    : [];
  const activeSourceIds = new Set(sourceRows.filter((source) => source.active).map((source) => source.id));
  const active = activeSourceIds.size;
  const needsAttention = pendingReview + approvedSourceIds.filter((id) => !activeSourceIds.has(id)).length;

  return {
    stats: {
      sourcesDiscovered,
      pendingReview,
      approved: approved.length,
      active,
      needsAttention,
    },
    runs,
    candidates: candidates.map(serializeCandidate).sort((left, right) =>
      getCandidateScore(right) - getCandidateScore(left),
    ),
  };
}

export async function listRuns() {
  await failLegacyApifyRuns();
  return prisma.sourceDiscoveryRun.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}

export async function getRun(id: string) {
  await failLegacyApifyRuns();
  const run = await prisma.sourceDiscoveryRun.findUnique({ where: { id } });
  if (!run) throw new NotFoundError("Discovery job not found");
  const candidates = await prisma.sourceSuggestion.findMany({
    where: { sourceDiscoveryRunId: id },
    orderBy: { createdAt: "desc" },
  });
  return { ...run, candidates: candidates.map(serializeCandidate) };
}

export async function listCandidates() {
  const candidates = await prisma.sourceSuggestion.findMany({
    where: { sourceDiscoveryRunId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return candidates.map(serializeCandidate).sort((left, right) =>
    getCandidateScore(right) - getCandidateScore(left),
  );
}

export async function reviewCandidate(
  id: string,
  input: SourceCandidateReviewInput,
  reviewedBy: string,
) {
  const candidate = await prisma.sourceSuggestion.findUnique({ where: { id } });
  if (!candidate || !candidate.sourceDiscoveryRunId) {
    throw new NotFoundError("Discovery candidate not found");
  }
  if (["APPROVED", "VERIFIED", "REJECTED", "IGNORED", "MERGED", "ACTIVATED"].includes(candidate.status)) {
    throw new ConflictError("This candidate already has a final review decision");
  }

  const metadata = metadataRecord(candidate.metadata);
  const reviewedAt = new Date();
  const reviewNotes = input.notes ?? null;

  if (input.action === "KEEP_SEPARATE") {
    if (typeof metadata.duplicateSourceId !== "string") {
      throw new ValidationError("There is no registered possible duplicate to keep separate from");
    }
    const updated = await prisma.$transaction(async (tx) => {
      const suggestion = await tx.sourceSuggestion.update({
        where: { id },
        data: {
          metadata: {
            ...metadata,
            duplicateDecision: "KEEP_SEPARATE",
            duplicateDecisionAt: reviewedAt.toISOString(),
          } as Prisma.InputJsonValue,
          reviewedBy,
          reviewedAt,
          reviewNotes,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: reviewedBy,
          action: "SOURCE_DISCOVERY_KEEP_SEPARATE",
          entityType: "SourceSuggestion",
          entityId: id,
          data: { duplicateSourceId: metadata.duplicateSourceId, notes: reviewNotes } as Prisma.InputJsonValue,
        },
      });
      return suggestion;
    });
    return { candidate: serializeCandidate(updated) };
  }

  if (input.action === "REJECT" || input.action === "IGNORE") {
    const status: SuggestionStatus = input.action === "REJECT" ? "REJECTED" : "IGNORED";
    const updated = await prisma.$transaction(async (tx) => {
      const suggestion = await tx.sourceSuggestion.update({
        where: { id },
        data: {
          status,
          reviewedBy,
          reviewedAt,
          reviewNotes,
          metadata: {
            ...metadata,
            reviewDecision: input.action,
            verificationStatus: "NOT_VERIFIED",
          } as Prisma.InputJsonValue,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: reviewedBy,
          action: `SOURCE_DISCOVERY_${input.action}`,
          entityType: "SourceSuggestion",
          entityId: id,
          data: { notes: reviewNotes } as Prisma.InputJsonValue,
        },
      });
      return suggestion;
    });
    return { candidate: serializeCandidate(updated) };
  }

  if (input.action === "MERGE") {
    const mergeSourceId = input.mergeSourceId ?? metadata.duplicateSourceId;
    if (typeof mergeSourceId !== "string") {
      throw new ValidationError("Select an existing registry source to merge this candidate into");
    }
    const result = await prisma.$transaction(async (tx) => {
      const source = await tx.source.findUnique({ where: { id: mergeSourceId } });
      if (!source) throw new NotFoundError("Merge target source not found");
      const sourceMetadata = metadataRecord(source.metadata);
      const matches = Array.isArray(sourceMetadata.discoveryMatches)
        ? sourceMetadata.discoveryMatches.filter(isRecord)
        : [];
      const mergedSource = await tx.source.update({
        where: { id: source.id },
        data: {
          metadata: {
            ...sourceMetadata,
            discoveryMatches: [
              ...matches,
              { candidateId: candidate.id, name: candidate.name, url: candidate.url, mergedAt: reviewedAt.toISOString() },
            ],
          } as Prisma.InputJsonValue,
        },
      });
      const updatedCandidate = await tx.sourceSuggestion.update({
        where: { id },
        data: {
          status: "MERGED",
          reviewedBy,
          reviewedAt,
          reviewNotes,
          metadata: {
            ...metadata,
            reviewDecision: "MERGE",
            mergedIntoSourceId: source.id,
            verificationStatus: "NOT_VERIFIED",
          } as Prisma.InputJsonValue,
        },
      });
      await tx.auditLog.create({
        data: {
          actorUserId: reviewedBy,
          action: "SOURCE_DISCOVERY_MERGE",
          entityType: "SourceSuggestion",
          entityId: id,
          data: { sourceId: source.id, notes: reviewNotes } as Prisma.InputJsonValue,
        },
      });
      return { candidate: serializeCandidate(updatedCandidate), source: mergedSource };
    });
    return result;
  }

  if (metadata.duplicateSourceId && metadata.duplicateDecision !== "KEEP_SEPARATE") {
    throw new ConflictError("Review the possible duplicate first. Choose Keep separate or Merge.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const latestCandidate = await tx.sourceSuggestion.findUnique({ where: { id } });
    if (!latestCandidate) throw new NotFoundError("Discovery candidate not found");
    const latestMetadata = metadataRecord(latestCandidate.metadata);
    if (latestMetadata.approvedSourceId) {
      throw new ConflictError("This candidate already has a registry source");
    }

    const sourceType = mapSourceType(
      typeof latestMetadata.sourceType === "string" ? latestMetadata.sourceType : "",
      Array.isArray(latestMetadata.sourceTypes) ? latestMetadata.sourceTypes.filter((value): value is string => typeof value === "string") : [],
    );
    const adapter = adapterForSourceType(sourceType);
    await tx.sourceAdapter.upsert({
      where: { key: adapter },
      update: {},
      create: {
        key: adapter,
        label: adapterLabel(adapter),
        version: "1.0.0",
        description: "Registered automatically when an administrator approves a discovered source.",
      },
    });
    const baseSlug = slugify(latestCandidate.name) || "discovered-source";
    let slug = baseSlug;
    let suffix = 1;
    while (await tx.source.findUnique({ where: { slug }, select: { id: true } })) {
      slug = ensureUniqueSlug(baseSlug, ++suffix);
      if (suffix > 500) throw new ConflictError("Unable to generate a unique source slug");
    }

    const sourceMetadata: SuggestionMetadata = {
      sourceDiscoveryCandidateId: latestCandidate.id,
      sourceDiscoveryRunId: latestCandidate.sourceDiscoveryRunId,
      sourceVerificationState: "PENDING",
      requiresSourceTest: true,
      discoveryAssessment: latestMetadata,
    };
    const source = await tx.source.create({
      data: {
        name: latestCandidate.name,
        slug,
        url: normalizedCandidateUrl(latestCandidate.url) ?? latestCandidate.url,
        adapter,
        countryCode: normalizeCountryCode(latestCandidate.countryCode),
        region: typeof latestMetadata.region === "string" ? latestMetadata.region : null,
        language: firstLanguageCode(latestMetadata.languages),
        category: typeof latestCandidate.category === "string" ? canonicalCategory(latestCandidate.category) : null,
        sourceType,
        active: false,
        crawlFrequency: "DAILY",
        attributionRequired: true,
        notes: latestCandidate.notes,
        metadata: sourceMetadata as Prisma.InputJsonValue,
        createdBy: reviewedBy,
      },
    });
    const snapshot = {
      sourceId: source.id,
      name: source.name,
      url: source.url,
      sourceType,
      adapter,
      countryCode: source.countryCode,
      approvedBy: reviewedBy,
      approvedAt: reviewedAt.toISOString(),
      candidateId: latestCandidate.id,
    };
    const fingerprint = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
    await tx.sourceVerification.create({
      data: {
        sourceId: source.id,
        version: 1,
        snapshot: snapshot as Prisma.InputJsonValue,
        fingerprint,
        status: "PENDING",
      },
    });
    const updatedCandidate = await tx.sourceSuggestion.update({
      where: { id },
      data: {
      status: "APPROVED",
        reviewedBy,
        reviewedAt,
        reviewNotes,
        metadata: {
          ...latestMetadata,
          reviewDecision: "APPROVE",
          approvedSourceId: source.id,
          verificationStatus: "PENDING_SOURCE_TEST",
          verificationFingerprint: fingerprint,
        } as Prisma.InputJsonValue,
      },
    });
    await tx.auditLog.create({
      data: {
        actorUserId: reviewedBy,
        action: "SOURCE_DISCOVERY_APPROVE",
        entityType: "Source",
        entityId: source.id,
        data: { candidateId: id, sourceId: source.id, fingerprint } as Prisma.InputJsonValue,
      },
    });
    return { candidate: serializeCandidate(updatedCandidate), source };
  });

  return result;
}

async function failLegacyApifyRuns(): Promise<void> {
  await prisma.sourceDiscoveryRun.updateMany({
    where: {
      apifyRunId: { not: null },
      status: { in: ["QUEUED", "RUNNING", "ANALYZING"] },
    },
    data: {
      status: "FAILED",
      errorMessage: "This run used the retired Apify discovery flow. Start a new run to use native AI web search.",
      processedAt: new Date(),
    },
  });
}

async function persistCandidates(
  run: {
    id: string;
    countries: string[];
    scope: string;
    minimumScore: number;
  },
  results: DiscoverySearchResult[],
  assessments: CandidateAssessment[],
): Promise<number> {
  const existingSources = await prisma.source.findMany({
    select: { id: true, name: true, url: true },
  });
  const assessmentById = new Map(results.map((result, index) => [result.id, assessments[index]]));
  let storedCount = 0;

  for (const result of results) {
    const assessment = assessmentById.get(result.id);
    if (!assessment) continue;
    const duplicate = findPossibleDuplicate(result, existingSources);
    const scores = {
      ...assessment.scores,
      duplicateRisk: duplicate ? duplicate.similarity : 8,
      overallConfidence: assessment.scores.overallConfidence,
    };
    const confidence = scores.overallConfidence;
    if (confidence < run.minimumScore) continue;

    const url = normalizedCandidateUrl(result.url);
    if (!url) continue;
    const host = getHost(url);
    const countryCode =
      assessment.countryCode ??
      (run.countries.length === 1 && /^[A-Za-z]{2}$/.test(run.countries[0])
        ? run.countries[0].toUpperCase()
        : null);
    const metadata: SuggestionMetadata = {
      organization: assessment.organization,
      region: assessment.region ?? (run.scope === "GLOBAL" ? null : run.scope.replace(/_/g, " ")),
      sourceType: assessment.sourceType,
      sourceTypes: assessment.sourceTypes,
      categories: assessment.categories,
      industries: assessment.industries,
      topics: assessment.topics,
      languages: assessment.languages,
      opportunityTypes: assessment.opportunityTypes,
      confidence,
      scores,
      evidence: assessment.evidence,
      concerns: assessment.concerns,
      rationale: assessment.rationale,
      recommendation: assessment.recommendation,
      searchQuery: result.query,
      searchSnippet: result.description,
      analysisMode: assessment.analysisMode,
      verificationStatus: "PENDING_SCOUT_VERIFICATION",
      duplicateSourceId: duplicate?.source.id ?? null,
      duplicateSourceName: duplicate?.source.name ?? null,
      duplicateSimilarity: duplicate?.similarity ?? null,
      duplicateDecision: null,
      discoveryDomain: host,
      discoveredAt: new Date().toISOString(),
    };
    const existing = await prisma.sourceSuggestion.findUnique({ where: { normalizedUrl: url } });
    const existingMetadata = existing ? metadataRecord(existing.metadata) : {};
    const mergedMetadata = { ...existingMetadata, ...metadata };
    const status = existing?.status ?? "SUGGESTED";
    const candidate = await prisma.sourceSuggestion.upsert({
      where: { normalizedUrl: url },
      update: {
        name: existing?.name ?? result.title,
        url,
        countryCode: existing?.countryCode ?? countryCode,
        category: existing?.category ?? assessment.categories[0] ?? null,
        notes: existing?.notes ?? assessment.rationale,
        metadata: mergedMetadata as Prisma.InputJsonValue,
        sourceDiscoveryRunId: run.id,
        // Preserve a human decision when a previously discovered URL appears again.
        status,
      },
      create: {
        name: result.title,
        url,
        normalizedUrl: url,
        countryCode,
        category: assessment.categories[0] ?? null,
        notes: assessment.rationale,
        metadata: mergedMetadata as Prisma.InputJsonValue,
        sourceDiscoveryRunId: run.id,
        status: "SUGGESTED",
      },
    });
    if (candidate) storedCount += 1;
  }
  return storedCount;
}

function findPossibleDuplicate(
  result: DiscoverySearchResult,
  sources: Array<{ id: string; name: string; url: string }>,
) {
  const resultHost = getHost(result.url);
  let best: { source: (typeof sources)[number]; similarity: number } | null = null;
  for (const source of sources) {
    const sourceHost = getHost(source.url);
    const sameHost = Boolean(resultHost && sourceHost && resultHost === sourceHost);
    const similarity = sameHost ? 100 : nameSimilarity(result.title, source.name);
    if (similarity >= 72 && (!best || similarity > best.similarity)) {
      best = { source, similarity };
    }
  }
  return best;
}

function serializeCandidate<T extends { metadata: Prisma.JsonValue }>(candidate: T) {
  return { ...candidate, metadata: metadataRecord(candidate.metadata) };
}

function getCandidateScore(candidate: { metadata: unknown }): number {
  const metadata = metadataRecord(candidate.metadata);
  const scores = metadataRecord(metadata.scores);
  return typeof scores.overallConfidence === "number"
    ? scores.overallConfidence
    : typeof metadata.confidence === "number" ? metadata.confidence : 0;
}

function metadataRecord(value: unknown): SuggestionMetadata {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCountryCode(value: string | null): string | null {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

function firstLanguageCode(value: unknown): string | null {
  if (!Array.isArray(value) || typeof value[0] !== "string") return null;
  const language = value[0].trim().toLowerCase();
  const known: Record<string, string> = { english: "en", french: "fr", arabic: "ar", spanish: "es", portuguese: "pt", swahili: "sw" };
  return known[language] ?? (/^[a-z]{2,10}$/.test(language) ? language : null);
}

function mapSourceType(sourceType: string, sourceTypes: string[]): SourceType {
  const value = `${sourceType} ${sourceTypes.join(" ")}`.toLowerCase();
  if (value.includes("government") || value.includes("ministry")) return "GOVERNMENT";
  if (value.includes("university") || value.includes("research institution")) return "UNIVERSITY";
  if (value.includes("foundation")) return "FOUNDATION";
  if (value.includes("accelerator") || value.includes("ecosystem") || value.includes("protocol")) return "ACCELERATOR";
  if (value.includes("procurement") || value.includes("tender")) return "PROCUREMENT_PORTAL";
  if (value.includes("scholarship")) return "SCHOLARSHIP_PORTAL";
  if (value.includes("grant")) return "GRANT_PORTAL";
  if (value.includes("job") || value.includes("company") || value.includes("employer")) return "JOB_BOARD";
  if (value.includes("ngo") || value.includes("nonprofit") || value.includes("community")) return "NGO";
  return "OTHER";
}

function adapterForSourceType(sourceType: SourceType): string {
  const adapters: Record<SourceType, string> = {
    GOVERNMENT: "government",
    PROCUREMENT_PORTAL: "procurementPortal",
    UNIVERSITY: "university",
    NGO: "ngo",
    FOUNDATION: "foundation",
    ACCELERATOR: "accelerator",
    GRANT_PORTAL: "grantPortal",
    JOB_BOARD: "jobBoard",
    SCHOLARSHIP_PORTAL: "scholarshipPortal",
    DEVELOPMENT_ORG: "ngo",
    PRIVATE_COMPANY: "genericListing",
    OTHER: "genericListing",
  };
  return adapters[sourceType];
}

function adapterLabel(adapter: string): string {
  const labels: Record<string, string> = {
    government: "Government source",
    procurementPortal: "Procurement portal",
    university: "University source",
    ngo: "NGO source",
    foundation: "Foundation source",
    accelerator: "Accelerator source",
    grantPortal: "Grant portal",
    jobBoard: "Job board",
    scholarshipPortal: "Scholarship portal",
    genericListing: "Generic listings source",
  };
  return labels[adapter] ?? adapter;
}
