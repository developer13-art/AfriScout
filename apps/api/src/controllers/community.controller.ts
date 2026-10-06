import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../utils/errors";

const authorSelect = {
  id: true,
  fullName: true,
  avatarUrl: true,
  countryCode: true,
  profile: { select: { username: true, headline: true, professionalIdentities: true } },
  professionalProfile: { select: { skills: true, profession: true } },
};

function userId(req: Request) {
  if (!req.user?.id) throw new UnauthorizedError();
  return req.user.id;
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") throw new BadRequestError("Text is required");
  const text = value.trim();
  if (!text || text.length > max) throw new BadRequestError(`Text must be 1–${max} characters`);
  return text;
}

export const feed = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const tab = typeof req.query.tab === "string" ? req.query.tab : "for-you";
  const actions = await prisma.communityUserAction.findMany({
    where: { OR: [{ actorId: viewer }, { targetId: viewer }] },
    select: { actorId: true, targetId: true, kind: true },
  });
  const hiddenAuthors = [...new Set(actions
    .filter((item) => item.actorId === viewer || item.kind === "BLOCK")
    .map((item) => item.actorId === viewer ? item.targetId : item.actorId))];
  const following = await prisma.communityFollow.findMany({
    where: { userId: viewer, targetType: "USER" },
    select: { targetKey: true },
  });
  const followingIds = following.map((item) => item.targetKey);
  const where: Prisma.CommunityPostWhereInput = { authorId: { notIn: hiddenAuthors } };
  where.author = { is: { status: "ACTIVE" } };
  if (tab === "following") where.authorId = { in: followingIds.length ? followingIds : ["00000000-0000-0000-0000-000000000000"] };
  if (tab === "opportunities") where.opportunityId = { not: null };
  if (tab === "achievements") where.kind = "ACHIEVEMENT";
  if (tab === "discussions") where.kind = { in: ["QUESTION", "OPPORTUNITY_DISCUSSION", "INDUSTRY_DISCUSSION"] };
  const posts = await prisma.communityPost.findMany({
    where,
    include: {
      author: { select: authorSelect },
      opportunity: { select: { id: true, slug: true, title: true, category: true, deadline: true } },
      comments: {
        take: 2,
        orderBy: { createdAt: "desc" },
        where: { author: { status: "ACTIVE" } },
        include: { author: { select: authorSelect } },
      },
      reactions: { where: { userId: viewer }, select: { id: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: tab === "trending"
      ? [{ reactions: { _count: "desc" } }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }],
    take: 40,
  });
  const followingSet = new Set(followingIds);
  res.json({ data: posts.map(({ reactions, ...post }) => ({
    ...post,
    likedByMe: reactions.length > 0,
    followingByMe: followingSet.has(post.authorId),
  })) });
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const authorId = userId(req);
  const content = cleanText(req.body?.content, 5000);
  const allowedKinds = ["GENERAL", "OPPORTUNITY_DISCUSSION", "QUESTION", "ACHIEVEMENT", "PROJECT_ANNOUNCEMENT", "EDUCATIONAL", "INDUSTRY_DISCUSSION"];
  const kind = allowedKinds.includes(req.body?.kind) ? req.body.kind : "GENERAL";
  const opportunityId = typeof req.body?.opportunityId === "string" ? req.body.opportunityId : null;
  if (opportunityId && !(await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } }))) {
    throw new NotFoundError("Opportunity not found");
  }
  const post = await prisma.communityPost.create({
    data: { authorId, content, kind, opportunityId },
    include: {
      author: { select: authorSelect },
      opportunity: { select: { id: true, slug: true, title: true, category: true, deadline: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });
  res.status(201).json({ data: { ...post, comments: [], likedByMe: false } });
});

export const react = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const postId = req.params.id;
  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
  if (!post) throw new NotFoundError("Post not found");
  const blocked = await prisma.communityUserAction.findFirst({
    where: {
      kind: "BLOCK",
      OR: [{ actorId: viewer, targetId: post.authorId }, { actorId: post.authorId, targetId: viewer }],
    },
  });
  if (blocked) throw new NotFoundError("Post not found");
  const existing = await prisma.communityReaction.findUnique({
    where: { postId_userId: { postId, userId: viewer } },
  });
  if (existing) {
    await prisma.communityReaction.delete({ where: { id: existing.id } });
    res.json({ data: { liked: false } });
  } else {
    await prisma.communityReaction.create({ data: { postId, userId: viewer } });
    res.json({ data: { liked: true } });
  }
});

export const comment = asyncHandler(async (req: Request, res: Response) => {
  const authorId = userId(req);
  const postId = req.params.id;
  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
  if (!post) throw new NotFoundError("Post not found");
  const blocked = await prisma.communityUserAction.findFirst({
    where: {
      kind: "BLOCK",
      OR: [{ actorId: authorId, targetId: post.authorId }, { actorId: post.authorId, targetId: authorId }],
    },
  });
  if (blocked) throw new BadRequestError("You cannot comment on this post");
  const comment = await prisma.communityComment.create({
    data: { postId, authorId, content: cleanText(req.body?.content, 2000) },
    include: { author: { select: authorSelect } },
  });
  res.status(201).json({ data: comment });
});

export const comments = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const post = await prisma.communityPost.findUnique({
    where: { id: req.params.id },
    select: { id: true, authorId: true },
  });
  if (!post) throw new NotFoundError("Post not found");
  const blocked = await prisma.communityUserAction.findFirst({
    where: {
      kind: "BLOCK",
      OR: [{ actorId: viewer, targetId: post.authorId }, { actorId: post.authorId, targetId: viewer }],
    },
  });
  if (blocked) throw new NotFoundError("Discussion not found");
  res.json({ data: await prisma.communityComment.findMany({
    orderBy: { createdAt: "asc" },
    take: 100,
    where: { postId: post.id, author: { is: { status: "ACTIVE" } } },
    include: { author: { select: authorSelect } },
  }) });
});

export const follow = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const targetId = req.params.userId;
  if (viewer === targetId) throw new BadRequestError("You cannot follow yourself");
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, status: true } });
  if (!target || target.status !== "ACTIVE") throw new NotFoundError("User not found");
  const where = { userId_targetType_targetKey: { userId: viewer, targetType: "USER", targetKey: targetId } };
  const existing = await prisma.communityFollow.findUnique({ where });
  if (existing) {
    await prisma.communityFollow.delete({ where: { id: existing.id } });
    res.json({ data: { following: false } });
  } else {
    await prisma.communityFollow.create({ data: { userId: viewer, targetType: "USER", targetKey: targetId } });
    res.json({ data: { following: true } });
  }
});

export const connections = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    include: { profile: true, professionalProfile: true, studentProfile: true, businessProfile: true },
  });
  if (!viewer) throw new UnauthorizedError();
  const actions = await prisma.communityUserAction.findMany({
    where: { OR: [{ actorId: viewerId }, { targetId: viewerId }] },
  });
  const ignored = new Set(actions.map((item) => item.actorId === viewerId ? item.targetId : item.actorId));
  const alreadyFollowing = new Set((await prisma.communityFollow.findMany({
    where: { userId: viewerId, targetType: "USER" }, select: { targetKey: true },
  })).map((item) => item.targetKey));
  const users = await prisma.user.findMany({
    where: { id: { notIn: [viewerId, ...ignored, ...alreadyFollowing] }, status: "ACTIVE", role: "USER" },
    include: { profile: true, professionalProfile: true, studentProfile: true, businessProfile: true },
    take: 80,
  });
  const own = [
    ...(viewer.professionalProfile?.skills ?? []),
    ...(viewer.studentProfile?.interests ?? []),
    ...(viewer.profile?.professionalIdentities ?? []),
    viewer.businessProfile?.industry ?? "",
  ].map((item) => item.toLowerCase()).filter(Boolean);
  const ownSet = new Set(own);
  const people = users.map((person) => {
    const skills = [
      ...(person.professionalProfile?.skills ?? []),
      ...(person.studentProfile?.interests ?? []),
      ...(person.profile?.professionalIdentities ?? []),
      person.businessProfile?.industry ?? "",
    ].filter(Boolean);
    const shared = [...new Set(skills.filter((skill) => ownSet.has(skill.toLowerCase())))];
    const location = Boolean(person.countryCode && person.countryCode === viewer.countryCode);
    const score = Math.min(98, Math.round((shared.length / Math.max(1, new Set([...own, ...skills]).size)) * 100 + (location ? 12 : 0)));
    const category = shared.length > 2 ? "Potential collaborator" : location ? "Industry peer" : "Community member";
    return {
      id: person.id,
      fullName: person.fullName,
      avatarUrl: person.avatarUrl,
      countryCode: person.countryCode,
      username: person.profile?.username,
      headline: person.profile?.headline ?? person.professionalProfile?.profession,
      shared,
      score,
      category,
      explanation: shared.length
        ? `You both list ${shared.slice(0, 3).join(", ")}${location ? " and are based in the same country" : ""}.`
        : "Explore their profile and interests to see where your work may align.",
    };
  }).sort((a, b) => b.score - a.score).slice(0, 12);
  res.json({ data: people });
});

export const report = asyncHandler(async (req: Request, res: Response) => {
  const reporterId = userId(req);
  const reason = cleanText(req.body?.reason, 80);
  const details = typeof req.body?.details === "string" ? req.body.details.trim().slice(0, 1000) : null;
  const postId = typeof req.body?.postId === "string" ? req.body.postId : null;
  const commentId = typeof req.body?.commentId === "string" ? req.body.commentId : null;
  const reportedUserId = typeof req.body?.reportedUserId === "string" ? req.body.reportedUserId : null;
  if (!postId && !commentId && !reportedUserId) throw new BadRequestError("Choose a post, comment, or user to report");
  if (postId && !(await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true } }))) throw new NotFoundError("Post not found");
  if (commentId && !(await prisma.communityComment.findUnique({ where: { id: commentId }, select: { id: true } }))) throw new NotFoundError("Comment not found");
  if (reportedUserId && !(await prisma.user.findUnique({ where: { id: reportedUserId }, select: { id: true } }))) throw new NotFoundError("User not found");
  const result = await prisma.communityReport.create({
    data: { reporterId, reason, details, postId, commentId, reportedUserId },
  });
  res.status(201).json({ data: { id: result.id, status: result.status } });
});

export const userAction = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const targetId = req.params.userId;
  const kind = req.body?.kind;
  if (kind !== "BLOCK" && kind !== "MUTE") throw new BadRequestError("Action must be BLOCK or MUTE");
  if (actorId === targetId) throw new BadRequestError("You cannot apply this action to yourself");
  if (!(await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } }))) throw new NotFoundError("User not found");
  const where = { actorId_targetId_kind: { actorId, targetId, kind } };
  const existing = await prisma.communityUserAction.findUnique({ where });
  if (existing) {
    await prisma.communityUserAction.delete({ where: { id: existing.id } });
    res.json({ data: { active: false } });
  } else {
    await prisma.communityUserAction.create({ data: { actorId, targetId, kind } });
    res.json({ data: { active: true } });
  }
});

export const adminReports = asyncHandler(async (_req: Request, res: Response) => {
  const reports = await prisma.communityReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      reporter: { select: { id: true, fullName: true, email: true } },
      reportedUser: { select: { id: true, fullName: true, email: true } },
      post: { select: { id: true, content: true, kind: true } },
      comment: { select: { id: true, content: true } },
    },
  });
  res.json({ data: reports });
});

export const reviewReport = asyncHandler(async (req: Request, res: Response) => {
  const status = req.body?.status;
  if (!["REVIEWED", "RESOLVED", "DISMISSED"].includes(status)) throw new BadRequestError("Invalid report status");
  const report = await prisma.communityReport.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!report) throw new NotFoundError("Community report not found");
  res.json({ data: await prisma.communityReport.update({
    where: { id: report.id },
    data: { status },
  }) });
});
