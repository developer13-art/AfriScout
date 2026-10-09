import type { Request, Response } from "express";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/errors";

const maxImageBytes = 5 * 1024 * 1024;
const maxAttachmentBytes = 10 * 1024 * 1024;
export const attachmentMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

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

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const mimeType = req.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  if (!Buffer.isBuffer(req.body) || req.body.length === 0 || req.body.length > maxAttachmentBytes) {
    throw new BadRequestError("Attachment must be no larger than 10 MB");
  }
  if (!(attachmentMimeTypes as readonly string[]).includes(mimeType)) {
    throw new BadRequestError("Use an image, PDF, text, CSV, Word, Excel, or PowerPoint file");
  }
  if (mimeType.startsWith("image/") && detectImageType(req.body) !== mimeType) {
    throw new BadRequestError("The image file content does not match its file type");
  }
  if (mimeType === "application/pdf" && req.body.toString("ascii", 0, 5) !== "%PDF-") {
    throw new BadRequestError("The PDF file is invalid");
  }

  let filename = req.get("x-file-name") ?? "attachment";
  try {
    filename = decodeURIComponent(filename);
  } catch {
    // Keep the original header value if it is not URI-encoded.
  }
  filename = filename
    .replace(/[\\/]/g, "_")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 255) || "attachment";

  const file = await prisma.mediaAttachment.create({
    data: {
      ownerId: requireUserId(req),
      filename,
      mimeType,
      size: req.body.length,
      data: req.body,
    },
    select: { id: true, filename: true, mimeType: true, size: true },
  });
  res.status(201).json({ data: { ...file, url: `/api/v1/media/attachments/${file.id}` } });
});

export const getAttachment = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = requireUserId(req);
  const file = await prisma.mediaAttachment.findUnique({
    where: { id: req.params.id },
    select: { id: true, ownerId: true, filename: true, mimeType: true, data: true },
  });
  if (!file) throw new NotFoundError("Attachment not found");

  let canRead = file.ownerId === viewerId;
  if (!canRead) {
    const [post, message] = await Promise.all([
      prisma.communityPost.findFirst({
        where: {
          removedAt: null,
          attachments: { array_contains: [{ id: file.id }] },
          author: { status: "ACTIVE" },
        },
        select: { communitySlug: true, community: { select: { visibility: true } } },
      }),
      prisma.communityMessage.findFirst({
        where: {
          attachments: { array_contains: [{ id: file.id }] },
          conversation: { is: { OR: [{ userAId: viewerId }, { userBId: viewerId }] } },
        },
        select: { senderId: true, recipientId: true },
      }),
    ]);
    if (message) {
      const peerId = message.senderId === viewerId ? message.recipientId : message.senderId;
      const [connection, block] = await Promise.all([
        prisma.communityConnection.findFirst({
          where: {
            status: "ACCEPTED",
            OR: [
              { requesterId: viewerId, recipientId: peerId },
              { requesterId: peerId, recipientId: viewerId },
            ],
          },
          select: { id: true },
        }),
        prisma.communityUserAction.findFirst({
          where: {
            kind: "BLOCK",
            OR: [
              { actorId: viewerId, targetId: peerId },
              { actorId: peerId, targetId: viewerId },
            ],
          },
          select: { id: true },
        }),
      ]);
      canRead = Boolean(connection && !block);
    }
    if (post) {
      if (!post.communitySlug || post.community?.visibility === "PUBLIC") {
        canRead = true;
      } else {
        const membership = await prisma.communitySpaceMember.findFirst({
          where: {
            userId: viewerId,
            space: { is: { slug: post.communitySlug } },
            status: { in: ["ACTIVE", "MUTED"] },
          },
          select: { id: true },
        });
        canRead ||= Boolean(membership);
      }
    }
  }
  if (!canRead) throw new NotFoundError("Attachment not found");

  const safeFilename = encodeURIComponent(file.filename).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  res
    .set("Cache-Control", "private, max-age=300")
    .set("X-Content-Type-Options", "nosniff")
    .set("Content-Disposition", `${file.mimeType.startsWith("image/") ? "inline" : "attachment"}; filename*=UTF-8''${safeFilename}`)
    .type(file.mimeType)
    .send(Buffer.from(file.data));
});
