import type { Request, Response } from "express";
import * as AuditService from "../services/auditLog/auditLog.service";
import { asyncHandler } from "../utils/asyncHandler";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuditService.list({
    action: typeof req.query.action === "string" ? req.query.action : undefined,
    entityType: typeof req.query.entityType === "string" ? req.query.entityType : undefined,
    entityId: typeof req.query.entityId === "string" ? req.query.entityId : undefined,
    actorUserId: typeof req.query.actorUserId === "string" ? req.query.actorUserId : undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 50,
  });
  res.json({ data: result.items });
});