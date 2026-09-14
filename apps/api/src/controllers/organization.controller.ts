import type { Request, Response } from "express";
import * as OrgService from "../services/users/organization.service";
import * as TeamService from "../services/users/team.service";
import { asyncHandler } from "../utils/asyncHandler";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await OrgService.listOrganizations({
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
  });
  res.json({ data: result.items });
});

export const get = asyncHandler(async (req: Request, res: Response) => {
  const data = await OrgService.getOrganizationById(req.params.id);
  res.json({ data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = await OrgService.createOrganization(req.body);
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const data = await OrgService.updateOrganization(req.params.id, req.body);
  res.json({ data });
});

export const members = asyncHandler(async (req: Request, res: Response) => {
  const data = await TeamService.listMembers(req.params.id);
  res.json({ data });
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const data = await TeamService.addMember({
    organizationId: req.params.id,
    userId: req.body.userId,
    role: req.body.role,
  });
  res.status(201).json({ data });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  await TeamService.removeMember(req.params.id, req.params.memberId);
  res.status(204).send();
});