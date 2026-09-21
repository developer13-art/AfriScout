import { prisma } from "../../config/database";
import { logger } from "../../config/logger";
import type { RunStatus, RunTrigger } from "@prisma/client";

export interface CreateRunInput {
  sourceId: string;
  actorId: string;
  trigger: RunTrigger;
  createdBy?: string | null;
}

export async function createSourceRun(input: CreateRunInput) {
  return prisma.sourceRun.create({
    data: {
      sourceId: input.sourceId,
      actorId: input.actorId,
      trigger: input.trigger,
      status: "QUEUED",
      createdBy: input.createdBy ?? null,
    },
  });
}

export async function markRunStarted(runId: string, apifyRunId: string) {
  return prisma.sourceRun.update({
    where: { id: runId },
    data: {
      status: "RUNNING",
      apifyRunId,
      startedAt: new Date(),
    },
  });
}

export async function markRunFinished(input: {
  runId: string;
  status: RunStatus;
  itemsFound: number;
  itemsImported: number;
  itemsUpdated: number;
  itemsDuplicate: number;
  itemsUnchanged: number;
  itemsInvalid: number;
  errorMessage?: string | null;
  errorDetails?: Record<string, unknown> | null;
  apifyDatasetId?: string | null;
}) {
  const now = new Date();
  return prisma.sourceRun.update({
    where: { id: input.runId },
    data: {
      status: input.status,
      finishedAt: now,
      itemsFound: input.itemsFound,
      itemsImported: input.itemsImported,
      itemsUpdated: input.itemsUpdated,
      itemsDuplicate: input.itemsDuplicate,
      itemsUnchanged: input.itemsUnchanged,
      itemsInvalid: input.itemsInvalid,
      errorMessage: input.errorMessage ?? null,
      errorDetails: input.errorDetails as never,
      apifyDatasetId: input.apifyDatasetId ?? null,
    },
  });
}

export async function listRuns(input: {
  sourceId?: string;
  status?: RunStatus;
  trigger?: RunTrigger;
  page: number;
  pageSize: number;
}) {
  const where: Record<string, unknown> = {};
  if (input.sourceId) where.sourceId = input.sourceId;
  if (input.status) where.status = input.status;
  if (input.trigger) where.trigger = input.trigger;

  const [items, total] = await Promise.all([
    prisma.sourceRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.sourceRun.count({ where }),
  ]);

  return { items, total };
}

export async function getRun(runId: string) {
  return prisma.sourceRun.findUnique({ where: { id: runId } });
}

export async function getRawItemsForRun(runId: string) {
  return prisma.rawOpportunity.findMany({
    where: { sourceRunId: runId },
    orderBy: { fetchedAt: "desc" },
  });
}

export function logRun(runId: string, status: string): void {
  logger.info({ runId, status }, "source_run");
}