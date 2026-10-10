import type { Request, Response } from "express";
import * as OrgService from "../services/users/organization.service";
import * as TeamService from "../services/users/team.service";
import * as OpportunityService from "../services/opportunities/opportunity.service";
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

export const mine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  const data = await OrgService.listOrganizationsForUser(req.user.id);
  res.json({ data });
});

export const membership = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  const data = await OrgService.getOrganizationMembership(req.params.id, req.user.id);
  res.json({ data });
});

export const join = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  const data = await OrgService.joinOrganization(req.params.id, req.user.id);
  res.status(200).json({ data });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  const data = await OrgService.createOrganization({ ...req.body, userId: req.user.id });
  res.status(201).json({ data });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  const data = await OrgService.updateOrganization(req.params.id, req.user.id, req.body);
  res.json({ data });
});

export const members = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  const data = await TeamService.listMembers(req.params.id, req.user.id);
  res.json({ data });
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  const data = await TeamService.addMember({
    organizationId: req.params.id,
    userId: req.body.userId,
    role: req.body.role,
    actorUserId: req.user.id,
  });
  res.status(201).json({ data });
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  await TeamService.removeMember(req.params.id, req.params.memberId, req.user.id);
  res.status(204).send();
});

export const createOpportunity = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new Error("Authenticated user missing");
  const data = await OpportunityService.createOrganizationOpportunity(
    req.params.id,
    req.user.id,
    req.body,
  );
  res.status(201).json({ data });
});