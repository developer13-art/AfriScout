import type { Request, Response } from "express";
import * as OrganizationService from "../services/users/organization.service";
import { asyncHandler } from "../utils/asyncHandler";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    data: await OrganizationService.getPublicOrganizationProfile(req.params.slug),
  });
});
