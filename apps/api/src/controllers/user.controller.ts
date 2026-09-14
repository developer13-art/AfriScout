import type { Request, Response } from "express";
import * as UserService from "../services/users/user.service";
import * as BusinessService from "../services/users/businessProfile.service";
import * as StudentService from "../services/users/studentProfile.service";
import * as ProfessionalService from "../services/users/professionalProfile.service";
import { asyncHandler } from "../utils/asyncHandler";
import { UnauthorizedError } from "../utils/errors";

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.requireUserById(requireUserId(req));
  res.json({ data: user });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.updateUser(requireUserId(req), req.body);
  res.json({ data: user });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await UserService.findUserById(requireUserId(req));
  res.json({ data: profile });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await UserService.updateUser(requireUserId(req), req.body);
  res.json({ data: profile });
});

export const getBusinessProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await BusinessService.getBusinessProfile(requireUserId(req));
  res.json({ data });
});

export const updateBusinessProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await BusinessService.upsertBusinessProfile(requireUserId(req), req.body);
  res.json({ data });
});

export const getStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await StudentService.getStudentProfile(requireUserId(req));
  res.json({ data });
});

export const updateStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await StudentService.upsertStudentProfile(requireUserId(req), req.body);
  res.json({ data });
});

export const getProfessionalProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await ProfessionalService.getProfessionalProfile(requireUserId(req));
  res.json({ data });
});

export const updateProfessionalProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = await ProfessionalService.upsertProfessionalProfile(requireUserId(req), req.body);
  res.json({ data });
});