import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/errors";

const maxImageBytes = 5 * 1024 * 1024;

function requireUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

function detectImageType(data: Buffer): string | null {
  if (
    data.length >= 8 &&
    data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) return "image/png";
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (
    data.length >= 12 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  ) return "image/webp";
  return null;
}

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0 || req.body.length > maxImageBytes) {
    throw new BadRequestError("Image must be no larger than 5 MB");
  }

  const mimeType = detectImageType(req.body);
  if (!mimeType || req.get("content-type")?.split(";")[0].trim().toLowerCase() !== mimeType) {
    throw new BadRequestError("Upload a valid PNG, JPEG, or WebP image");
  }

  const image = await prisma.mediaImage.create({
    data: { ownerId: requireUserId(req), mimeType, data: req.body },
    select: { id: true },
  });
  res.status(201).json({ data: { id: image.id } });
});

export const getImage = asyncHandler(async (req: Request, res: Response) => {
  const image = await prisma.mediaImage.findUnique({
    where: { id: req.params.id },
    select: { mimeType: true, data: true },
  });
  if (!image) throw new NotFoundError("Image not found");

  res
    .set("Cache-Control", "public, max-age=31536000, immutable")
    .set("X-Content-Type-Options", "nosniff")
    .type(image.mimeType)
    .send(Buffer.from(image.data));
});
