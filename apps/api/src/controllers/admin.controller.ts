import type { Request, Response } from "express";
import * as UserService from "../services/users/user.service";
import { asyncHandler } from "../utils/asyncHandler";

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await UserService.listUsers({
    page: req.query.page ? Number(req.query.page) : 1,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : 20,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    role: typeof req.query.role === "string" ? (req.query.role as never) : undefined,
    status: typeof req.query.status === "string" ? req.query.status : undefined,
  });
  res.json({ data: result.items });
});

export const getUser = asyncHandler(async (req: Request, res: Response) => {
  const data = await UserService.requireUserById(req.params.id);
  res.json({ data });
});

export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
  const data = await UserService.updateUserRole(req.params.id, req.body.role);
  res.json({ data });
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = await UserService.updateUserStatus(req.params.id, req.body.status);
  res.json({ data });
});