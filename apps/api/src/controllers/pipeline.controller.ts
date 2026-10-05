import type { Request, Response } from "express";
import * as PipelineService from "../services/pipeline/pipeline.service";
import * as StageService from "../services/pipeline/pipelineStage.service";
import * as ChecklistService from "../services/pipeline/checklist.service";
import * as NotesService from "../services/pipeline/notes.service";
import * as OutcomeService from "../services/pipeline/outcome.service";
import * as SubmissionService from "../services/pipeline/submission.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const listPipelines = asyncHandler(async (req: Request, res: Response) => {
  const data = await PipelineService.listPipelines(requireUserId(req));
  res.json({ data });
});

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const pipelineId = typeof req.query.pipelineId === "string" ? req.query.pipelineId : undefined;
  const data = await PipelineService.listItems(requireUserId(req), pipelineId);
  res.json({ data });
});

export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const item = await PipelineService.getItem(requireUserId(req), req.params.itemId);
  res.json({ data: item });
});

export const add = asyncHandler(async (req: Request, res: Response) => {
  const data = await PipelineService.addItem({
    userId: requireUserId(req),
    opportunityId: req.body.opportunityId,
    pipelineId: req.body.pipelineId,
    ownerUserId: req.body.ownerUserId,
  });
  res.status(201).json({ data });
});

export const move = asyncHandler(async (req: Request, res: Response) => {
  const data = await StageService.moveStage({
    userId: requireUserId(req),
    itemId: req.params.itemId,
    stage: req.body.stage,
    submissionReference: req.body.submissionReference,
    notes: req.body.notes,
  });
  res.json({ data });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await PipelineService.removeItem
    ? PipelineService.removeItem
    : await import("../config/database").then(({ prisma }) =>
        prisma.pipelineItem.deleteMany({
          where: { id: req.params.itemId, pipeline: { userId: requireUserId(req) } },
        }),
      );
  res.status(204).send();
});

export const updateChecklist = asyncHandler(async (req: Request, res: Response) => {
  const data = await ChecklistService.upsertChecklist(
    requireUserId(req),
    req.params.itemId,
    req.body.items,
  );
  res.json({ data });
});

export const addNote = asyncHandler(async (req: Request, res: Response) => {
  const data = await NotesService.addNote(
    requireUserId(req),
    req.params.itemId,
    req.body.body,
  );
  res.status(201).json({ data });
});

export const submission = asyncHandler(async (req: Request, res: Response) => {
  const data = await SubmissionService.recordSubmission({
    userId: requireUserId(req),
    itemId: req.params.itemId,
    submissionReference: req.body.submissionReference,
  });
  res.json({ data });
});

export const outcome = asyncHandler(async (req: Request, res: Response) => {
  const data = await OutcomeService.recordOutcome({
    userId: requireUserId(req),
    itemId: req.params.itemId,
    outcomeType: req.body.outcomeType,
    outcomeValue: req.body.outcomeValue,
    outcomeCurrency: req.body.outcomeCurrency,
    outcomeDate: req.body.outcomeDate ? new Date(req.body.outcomeDate) : null,
  });
  res.json({ data });
});