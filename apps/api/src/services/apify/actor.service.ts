import { apifyConfig } from "../../config/apify";
import { apifyRequest } from "./apify.service";
import type { ApifyActorInput, ApifyActorOutputItem } from "../../types/apify";
import { InternalError } from "../../utils/errors";

export interface ActorRunStartResult {
  id: string;
  actId: string;
  status: string;
  startedAt: string;
  defaultDatasetId: string | null;
}

export async function startActorRun(
  actorId: string,
  input: ApifyActorInput,
  options: { memoryMb?: number; timeoutSeconds?: number } = {},
): Promise<ActorRunStartResult> {
  if (!actorId) {
    throw new InternalError("Apify actor ID is not configured");
  }

  const query: Record<string, string | number> = {};
  if (options.memoryMb) query.memory = options.memoryMb;
  if (options.timeoutSeconds) query.timeout = options.timeoutSeconds;

  const response = await apifyRequest<{ data: ActorRunStartResult }>(
    `/acts/${actorId}/runs`,
    { method: "POST", query, body: input },
  );

  return response.data;
}

export async function runAndWait(
  actorId: string,
  input: ApifyActorInput,
  options: {
    memoryMb?: number;
    timeoutSeconds?: number;
    pollIntervalMs?: number;
    maxWaitMs?: number;
  } = {},
): Promise<{ runId: string; datasetId: string | null; status: string }> {
  const started = await startActorRun(actorId, input, options);
  const pollIntervalMs = options.pollIntervalMs ?? 3000;
  const maxWaitMs = options.maxWaitMs ?? (options.timeoutSeconds ?? 600) * 1000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const run = await getActorRun(started.id);
    if (
      run.status === "SUCCEEDED" ||
      run.status === "FAILED" ||
      run.status === "ABORTED" ||
      run.status === "TIMED-OUT"
    ) {
      return { runId: run.id, datasetId: run.defaultDatasetId, status: run.status };
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new InternalError("Actor run timed out waiting for completion");
}

export interface ActorRunDetail {
  id: string;
  actId: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  defaultDatasetId: string | null;
  stats?: Record<string, unknown>;
}

export async function getActorRun(runId: string): Promise<ActorRunDetail> {
  const response = await apifyRequest<{ data: ActorRunDetail }>(`/actor-runs/${runId}`);
  return response.data;
}

export async function abortActorRun(runId: string): Promise<void> {
  await apifyRequest(`/actor-runs/${runId}/abort`, { method: "POST" });
}

export function normalizeActorOutputItem(
  item: Record<string, unknown>,
  sourceId: string,
  adapter: string,
): ApifyActorOutputItem {
  return {
    title: String(item.title ?? "").trim(),
    organization: item.organization ? String(item.organization) : null,
    country: item.country ? String(item.country) : null,
    location: item.location ? String(item.location) : null,
    category: item.category ? String(item.category) : null,
    publishedAt: item.publishedAt ? String(item.publishedAt) : null,
    deadline: item.deadline ? String(item.deadline) : null,
    description: item.description ? String(item.description) : null,
    sourceUrl: String(item.sourceUrl ?? item.url ?? ""),
    sourceName: item.sourceName ? String(item.sourceName) : null,
    sourceId,
    adapter,
    referenceNumber: item.referenceNumber ? String(item.referenceNumber) : null,
    valueMin: typeof item.valueMin === "number" ? item.valueMin : null,
    valueMax: typeof item.valueMax === "number" ? item.valueMax : null,
    currency: item.currency ? String(item.currency) : null,
    eligibility: item.eligibility ? String(item.eligibility) : null,
    requirements: item.requirements ? String(item.requirements) : null,
    documents: Array.isArray(item.documents)
      ? item.documents.filter((d): d is string => typeof d === "string")
      : [],
    raw: item,
  };
}

export const apifyActors = apifyConfig.actors;