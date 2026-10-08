import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../config/database";
import { runAi } from "../services/ai/ai.service";
import { asyncHandler } from "../utils/asyncHandler";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../utils/errors";

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

async function requireSpaceMembership(spaceId: string, memberId: string) {
  const membership = await prisma.communitySpaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId: memberId } },
    select: { role: true, status: true },
  });
  if (membership?.status !== "ACTIVE" && membership?.status !== "MUTED") throw new NotFoundError("Community not found");
  return membership;
}

async function requireActiveSpaceMember(spaceId: string, memberId: string) {
  const membership = await requireSpaceMembership(spaceId, memberId);
  if (membership.status !== "ACTIVE") throw new BadRequestError("Muted members cannot publish group content");
  return membership;
}

async function requireSpaceModerator(spaceId: string, memberId: string) {
  const membership = await requireSpaceMembership(spaceId, memberId);
  if (!["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
    throw new NotFoundError("Community not found");
  }
  return membership;
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== "string") throw new BadRequestError("Text is required");
  const text = value.trim();
  if (!text || text.length > max) throw new BadRequestError(`Text must be 1–${max} characters`);
  return text;
}

function isMissingSchemaError(error: unknown): boolean {
  const candidate = error as { code?: string; meta?: { table?: string; column?: string; modelName?: string } };
  if (!candidate || typeof candidate !== "object") return false;
  if (candidate.code !== "P2021" && candidate.code !== "P2022") return false;
  const details = `${candidate.meta?.table ?? ""} ${candidate.meta?.column ?? ""} ${candidate.meta?.modelName ?? ""}`.toLowerCase();
  return details.includes("community_user_actions") || details.includes("user_profiles") || details.includes("visibility");
}

async function withMissingSchemaFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (isMissingSchemaError(error)) return fallback;
    throw error;
  }
}

async function loadCommunityUserActions(where: Prisma.CommunityUserActionWhereInput) {
  return withMissingSchemaFallback(
    () => prisma.communityUserAction.findMany({
      where,
      include: { target: { select: { id: true, fullName: true, avatarUrl: true } } },
    }),
    [],
  ) as Promise<any[]>;
}

async function loadUserProfile(userId: string) {
  return withMissingSchemaFallback(
    () => prisma.userProfile.findUnique({
      where: { userId },
      select: { visibility: true, analyzable: true, visibilityRules: true },
    }),
    null,
  ) as Promise<any>;
}

async function loadUserWithProfile(userId: string) {
  return withMissingSchemaFallback(
    async () => prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, professionalProfile: true, studentProfile: true, businessProfile: true },
    }),
    (await prisma.user.findUnique({
      where: { id: userId },
      include: { professionalProfile: true, studentProfile: true, businessProfile: true },
    })) as any,
  ) as Promise<any>;
}

export const feed = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const tab = typeof req.query.tab === "string" ? req.query.tab : "for-you";
  const communitySlug = typeof req.query.group === "string" ? req.query.group.trim().slice(0, 120) : "";
  const actions = await withMissingSchemaFallback(
    () => prisma.communityUserAction.findMany({
      where: { OR: [{ actorId: viewer }, { targetId: viewer }] },
      select: { actorId: true, targetId: true, kind: true },
    }),
    [],
  );
  const hiddenAuthors = [...new Set(actions
    .filter((item) => item.actorId === viewer || item.kind === "BLOCK")
    .map((item) => item.actorId === viewer ? item.targetId : item.actorId))];
  const following = await prisma.communityFollow.findMany({
    where: { userId: viewer },
    select: { targetType: true, targetKey: true },
  });
  const followingIds = following.filter((item) => item.targetType === "USER").map((item) => item.targetKey);
  const where: Prisma.CommunityPostWhereInput = { authorId: { notIn: hiddenAuthors }, removedAt: null };
  where.author = { is: { status: "ACTIVE" } };
  if (communitySlug) {
    const space = await prisma.communitySpace.findUnique({
      where: { slug: communitySlug },
      select: { id: true, slug: true, visibility: true },
    });
    if (!space) throw new NotFoundError("Community not found");
    if (space.visibility !== "PUBLIC") {
      const membership = await prisma.communitySpaceMember.findUnique({
        where: { spaceId_userId: { spaceId: space.id, userId: viewer } },
        select: { status: true },
      });
      if (membership?.status !== "ACTIVE" && membership?.status !== "MUTED") throw new NotFoundError("Community not found");
    }
    where.communitySlug = communitySlug;
  }
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
        where: { author: { status: "ACTIVE" }, removedAt: null },
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
  const followedTopics = new Set(following.filter((item) => item.targetType === "TOPIC").map((item) => item.targetKey.toLowerCase()));
  const followedIndustries = new Set(following.filter((item) => item.targetType === "INDUSTRY").map((item) => item.targetKey.toLowerCase()));
  const followedCountries = new Set(following.filter((item) => item.targetType === "COUNTRY").map((item) => item.targetKey.toUpperCase()));
  const rankedPosts = tab === "for-you"
    ? posts.map((post) => {
        const topicMatches = post.topics.filter((topic) => followedTopics.has(topic.toLowerCase())).length;
        const industryMatches = post.industries.filter((industry) => followedIndustries.has(industry.toLowerCase())).length;
        const countryMatch = post.author.countryCode && followedCountries.has(post.author.countryCode) ? 1 : 0;
        return { post, relevance: topicMatches * 3 + industryMatches * 2 + countryMatch };
      }).sort((a, b) => b.relevance - a.relevance || b.post.createdAt.getTime() - a.post.createdAt.getTime()).map(({ post }) => post)
    : posts;
  res.json({ data: rankedPosts.map(({ reactions, ...post }) => ({
    ...post,
    likedByMe: reactions.length > 0,
    followingByMe: followingSet.has(post.authorId),
  })) });
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const authorId = userId(req);
  const content = cleanText(req.body?.content, 5000);
  const allowedKinds = ["GENERAL", "ANNOUNCEMENT", "OPPORTUNITY_DISCUSSION", "QUESTION", "ACHIEVEMENT", "PROJECT_ANNOUNCEMENT", "EDUCATIONAL", "INDUSTRY_DISCUSSION"];
  const kind = allowedKinds.includes(req.body?.kind) ? req.body.kind : "GENERAL";
  const opportunityId = typeof req.body?.opportunityId === "string" ? req.body.opportunityId : null;
  if (opportunityId && !(await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } }))) {
    throw new NotFoundError("Opportunity not found");
  }
  const communitySlug = typeof req.body?.communitySlug === "string" ? req.body.communitySlug : null;
  if (communitySlug) {
    const space = await prisma.communitySpace.findUnique({
      where: { slug: communitySlug },
      select: { id: true, visibility: true },
    });
    if (!space) throw new NotFoundError("Community not found");
    const membership = await prisma.communitySpaceMember.findUnique({
      where: { spaceId_userId: { spaceId: space.id, userId: authorId } },
      select: { status: true, role: true },
    });
    if (membership?.status !== "ACTIVE") throw new NotFoundError("Community not found");
    if (kind === "ANNOUNCEMENT" && !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) {
      throw new BadRequestError("Only group moderators can publish announcements");
    }
  } else if (kind === "ANNOUNCEMENT") {
    throw new BadRequestError("Official announcements must belong to a group");
  }
  const post = await prisma.communityPost.create({
    data: { authorId, content, kind, opportunityId, communitySlug },
    include: {
      author: { select: authorSelect },
      opportunity: { select: { id: true, slug: true, title: true, category: true, deadline: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });
  res.status(201).json({ data: { ...post, comments: [], likedByMe: false } });
});

export const searchOpportunities = asyncHandler(async (req: Request, res: Response) => {
  userId(req);
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  if (query.length < 2) return res.json({ data: [] });
  const items = await prisma.opportunity.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, slug: true, title: true, category: true, deadline: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  res.json({ data: items });
});

export const opportunityInteractionSummary = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const opportunityId = req.params.id;
  if (!(await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } }))) {
    throw new NotFoundError("Opportunity not found");
  }
  const [counts, mine] = await Promise.all([
    prisma.opportunityInteraction.groupBy({
      by: ["kind"],
      where: { opportunityId },
      _count: { _all: true },
    }),
    prisma.opportunityInteraction.findMany({
      where: { opportunityId, userId: viewer },
      select: { kind: true },
    }),
  ]);
  res.json({
    data: {
      counts: Object.fromEntries(counts.map((item) => [item.kind, item._count._all])),
      mine: mine.map((item) => item.kind),
    },
  });
});

export const interactWithOpportunity = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const opportunityId = req.params.id;
  const kind = req.body?.kind;
  if (!["INTERESTED", "APPLYING", "COMPLETED"].includes(kind)) {
    throw new BadRequestError("Choose Interested, Applying, or Completed");
  }
  if (!(await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } }))) {
    throw new NotFoundError("Opportunity not found");
  }
  const where = { userId_opportunityId_kind: { userId: viewer, opportunityId, kind } };
  const current = await prisma.opportunityInteraction.findUnique({ where });
  if (current) {
    await prisma.opportunityInteraction.delete({ where: { id: current.id } });
    return res.json({ data: { active: false } });
  }
  await prisma.opportunityInteraction.create({ data: { userId: viewer, opportunityId, kind } });
  res.json({ data: { active: true } });
});

export const react = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const postId = req.params.id;
  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true, communitySlug: true, removedAt: true } });
  if (!post || post.removedAt) throw new NotFoundError("Post not found");
  if (post.communitySlug) {
    const group = await prisma.communitySpace.findUnique({ where: { slug: post.communitySlug }, select: { id: true } });
    if (!group) throw new NotFoundError("Post not found");
    await requireActiveSpaceMember(group.id, viewer);
  }
  const blocked = await withMissingSchemaFallback(
    () => prisma.communityUserAction.findFirst({
      where: {
        kind: "BLOCK",
        OR: [{ actorId: viewer, targetId: post.authorId }, { actorId: post.authorId, targetId: viewer }],
      },
    }),
    null,
  );
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
  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true, communitySlug: true, lockedAt: true, removedAt: true } });
  if (!post || post.removedAt) throw new NotFoundError("Post not found");
  if (post.lockedAt) throw new BadRequestError("This discussion is locked by a group moderator");
  if (post.communitySlug) {
    const group = await prisma.communitySpace.findUnique({ where: { slug: post.communitySlug }, select: { id: true } });
    if (!group) throw new NotFoundError("Post not found");
    await requireActiveSpaceMember(group.id, authorId);
  }
  const blocked = await withMissingSchemaFallback(
    () => prisma.communityUserAction.findFirst({
      where: {
        kind: "BLOCK",
        OR: [{ actorId: authorId, targetId: post.authorId }, { actorId: post.authorId, targetId: authorId }],
      },
    }),
    null,
  );
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
    select: { id: true, authorId: true, communitySlug: true, removedAt: true },
  });
  if (!post || post.removedAt) throw new NotFoundError("Post not found");
  if (post.communitySlug) {
    const group = await prisma.communitySpace.findUnique({ where: { slug: post.communitySlug }, select: { id: true, visibility: true } });
    if (!group) throw new NotFoundError("Post not found");
    if (group.visibility !== "PUBLIC") await requireSpaceMembership(group.id, viewer);
  }
  const blocked = await withMissingSchemaFallback(
    () => prisma.communityUserAction.findFirst({
      where: {
        kind: "BLOCK",
        OR: [{ actorId: viewer, targetId: post.authorId }, { actorId: post.authorId, targetId: viewer }],
      },
    }),
    null,
  );
  if (blocked) throw new NotFoundError("Discussion not found");
  res.json({ data: await prisma.communityComment.findMany({
    orderBy: { createdAt: "asc" },
    take: 100,
    where: { postId: post.id, removedAt: null, author: { is: { status: "ACTIVE" } } },
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

export const followTarget = asyncHandler(async (req: Request, res: Response) => {
  const viewer = userId(req);
  const targetType = req.body?.targetType as string;
  const rawKey = cleanText(req.body?.targetKey, 160);
  const targetKey = ["TOPIC", "INDUSTRY"].includes(targetType) ? rawKey.toLowerCase() : rawKey;
  if (!["ORGANIZATION", "INDUSTRY", "TOPIC", "OPPORTUNITY", "COUNTRY"].includes(targetType)) {
    throw new BadRequestError("Unsupported follow type");
  }
  if (targetType === "COUNTRY" && !/^[A-Za-z]{2}$/.test(targetKey)) {
    throw new BadRequestError("Country follows require a two-letter country code");
  }
  if (targetType === "OPPORTUNITY" && !(await prisma.opportunity.findUnique({ where: { slug: targetKey }, select: { id: true } }))) {
    throw new NotFoundError("Opportunity not found");
  }
  if (targetType === "ORGANIZATION" && !(await prisma.organization.findUnique({ where: { id: targetKey }, select: { id: true } }))) {
    throw new NotFoundError("Organization not found");
  }
  const where = { userId_targetType_targetKey: { userId: viewer, targetType, targetKey } };
  const existing = await prisma.communityFollow.findUnique({ where });
  if (existing) {
    await prisma.communityFollow.delete({ where: { id: existing.id } });
    return res.json({ data: { following: false } });
  }
  await prisma.communityFollow.create({ data: { userId: viewer, targetType, targetKey } });
  res.json({ data: { following: true } });
});

export const connections = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const viewer: any = await loadUserWithProfile(viewerId);
  if (!viewer) throw new UnauthorizedError();
  const actions = await withMissingSchemaFallback(
    () => prisma.communityUserAction.findMany({
      where: { OR: [{ actorId: viewerId }, { targetId: viewerId }] },
    }),
    [],
  );
  const ignored = new Set(actions.map((item) => item.actorId === viewerId ? item.targetId : item.actorId));
  const alreadyFollowing = new Set((await prisma.communityFollow.findMany({
    where: { userId: viewerId, targetType: "USER" }, select: { targetKey: true },
  })).map((item) => item.targetKey));
  let users: any[];
  try {
    users = await prisma.user.findMany({
      where: {
        id: { notIn: [viewerId, ...ignored, ...alreadyFollowing] },
        status: "ACTIVE",
        role: "USER",
        profile: { is: { visibility: "PUBLIC", analyzable: true } },
      },
      include: { profile: true, professionalProfile: true, studentProfile: true, businessProfile: true },
      take: 80,
    });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    users = await prisma.user.findMany({
      where: {
        id: { notIn: [viewerId, ...ignored, ...alreadyFollowing] },
        status: "ACTIVE",
        role: "USER",
      },
      include: { profile: true, professionalProfile: true, studentProfile: true, businessProfile: true },
      take: 80,
    });
  }
  const own = [
    ...(viewer.professionalProfile?.skills ?? []),
    ...(viewer.studentProfile?.interests ?? []),
    ...((viewer as any).profile?.professionalIdentities ?? []),
    viewer.businessProfile?.industry ?? "",
  ].map((item) => String(item).toLowerCase()).filter(Boolean);
  const ownSet = new Set(own);
  const people = users.map((person: any) => {
    const skills = [
      ...(person.professionalProfile?.skills ?? []),
      ...(person.studentProfile?.interests ?? []),
      ...((person as any).profile?.professionalIdentities ?? []),
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
      username: (person as any).profile?.username,
      headline: (person as any).profile?.headline ?? person.professionalProfile?.profession,
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

export const members = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const [following, followers] = await Promise.all([
    prisma.communityFollow.findMany({
      where: { userId: viewerId, targetType: "USER" },
      select: { targetKey: true },
    }),
    prisma.communityFollow.findMany({
      where: { targetType: "USER", targetKey: viewerId },
      select: { userId: true },
    }),
  ]);
  const followingIds = new Set(following.map((item) => item.targetKey));
  const followerIds = new Set(followers.map((item) => item.userId));
  const where: Prisma.UserWhereInput = {
    id: { not: viewerId },
    role: "USER",
    status: "ACTIVE",
  };
  if (query) {
    where.OR = [
      { fullName: { contains: query, mode: "insensitive" } },
      { profile: { is: { username: { contains: query, mode: "insensitive" } } } },
      { profile: { is: { headline: { contains: query, mode: "insensitive" } } } },
      { professionalProfile: { is: { profession: { contains: query, mode: "insensitive" } } } },
      { professionalProfile: { is: { skills: { has: query } } } },
      { profile: { is: { interests: { has: query } } } },
      { profile: { is: { industries: { has: query } } } },
    ];
  }
  let people;
  try {
    people = await prisma.user.findMany({
      where: {
        ...where,
        profile: { is: { visibility: { in: ["PUBLIC", "FOLLOWERS"] } } },
      },
      include: { profile: true, professionalProfile: true, studentProfile: true, businessProfile: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
    people = await prisma.user.findMany({
      where,
      include: { profile: true, professionalProfile: true, studentProfile: true, businessProfile: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  res.json({ data: people
    .filter((person: any) => {
      const visibility = person.profile?.visibility ?? "PUBLIC";
      return visibility === "PUBLIC" || (visibility === "FOLLOWERS" && followerIds.has(person.id));
    })
    .map((person: any) => ({
      id: person.id,
      fullName: person.fullName,
      avatarUrl: person.avatarUrl,
      countryCode: person.countryCode,
      username: person.profile?.username,
      headline: person.profile?.headline ?? person.professionalProfile?.profession,
      bio: person.profile?.bio,
      skills: person.professionalProfile?.skills ?? [],
      interests: [...new Set([...(person.profile?.interests ?? []), ...(person.studentProfile?.interests ?? [])])],
      following: followingIds.has(person.id),
    })) });
});

export const createSpace = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const { name, slug, description, category, purpose, visibility, countryCode, language, profileImageUrl, coverImageUrl, topics, joinQuestions } = req.body;
  const normalizedSlug = slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    throw new BadRequestError("Group username can contain lowercase letters, numbers, and hyphens");
  }
  if (await prisma.communitySpace.findUnique({ where: { slug: normalizedSlug }, select: { id: true } })) {
    throw new BadRequestError("That group username is already taken");
  }
  let space;
  try {
    space = await prisma.communitySpace.create({
      data: {
        name: name.trim(),
        slug: normalizedSlug,
        description: description.trim(),
        category,
        purpose,
        visibility,
        countryCode: countryCode || null,
        language,
        profileImageUrl: profileImageUrl || null,
        coverImageUrl: coverImageUrl || null,
        topics,
        joinQuestions: joinQuestions ?? [],
        memberships: { create: { userId: actorId, role: "OWNER", status: "ACTIVE" } },
      },
      select: { id: true, name: true, slug: true },
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      throw new ConflictError("That group username is already taken");
    }
    throw error;
  }
  res.status(201).json({ data: space });
});

export const spaces = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const [rows, memberships] = await Promise.all([
    prisma.communitySpace.findMany({
      where: {
        OR: [
          { visibility: { not: "HIDDEN" } },
          { memberships: { some: { userId: viewerId, role: "OWNER" } } },
        ],
      },
      orderBy: { name: "asc" },
      take: 100,
      include: { _count: { select: { posts: true } } },
    }),
    prisma.communitySpaceMember.findMany({
      where: { userId: viewerId },
      select: { space: { select: { slug: true } }, status: true },
    }),
  ]);
  const membershipBySlug = new Map(memberships.map((item) => [item.space.slug, item.status]));
  const data = await Promise.all(rows.map(async (space) => ({
    id: space.id,
    name: space.name,
    slug: space.slug,
    description: space.description,
    category: space.category,
    purpose: space.purpose,
    visibility: space.visibility,
    countryCode: space.countryCode,
    language: space.language,
    profileImageUrl: space.profileImageUrl,
    coverImageUrl: space.coverImageUrl,
    topics: space.topics,
    joinQuestions: space.joinQuestions,
    postCount: space._count.posts,
    memberCount: await prisma.communitySpaceMember.count({
      where: { spaceId: space.id, status: { in: ["ACTIVE", "MUTED"] } },
    }),
    membershipStatus: membershipBySlug.get(space.slug) ?? null,
    following: membershipBySlug.get(space.slug) === "ACTIVE",
  })));
  res.json({ data });
});

export const space = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const slug = req.params.slug;
  const group = await prisma.communitySpace.findUnique({
    where: { slug },
    include: {
      _count: { select: { posts: true, memberships: { where: { status: { in: ["ACTIVE", "MUTED"] } } } } },
      memberships: {
        where: { status: { in: ["ACTIVE", "MUTED"] } },
        orderBy: { createdAt: "asc" },
        take: 8,
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      },
      posts: {
        where: { author: { status: "ACTIVE" }, removedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          author: { select: authorSelect },
          opportunity: { select: { id: true, slug: true, title: true, category: true, deadline: true } },
          _count: { select: { comments: true, reactions: true } },
        },
      },
    },
  });
  if (!group) throw new NotFoundError("Community not found");
  const membership = await prisma.communitySpaceMember.findUnique({
    where: { spaceId_userId: { spaceId: group.id, userId: viewerId } },
    select: { status: true, role: true },
  });
  const hasContentAccess = membership?.status === "ACTIVE" || membership?.status === "MUTED";
  if (group.visibility === "HIDDEN" && !hasContentAccess) throw new NotFoundError("Community not found");
  if (group.visibility !== "PUBLIC" && !hasContentAccess && membership?.role !== "OWNER") {
    return res.json({ data: {
      id: group.id, name: group.name, slug: group.slug, description: group.description,
      category: group.category, purpose: group.purpose, visibility: group.visibility,
      countryCode: group.countryCode, language: group.language, profileImageUrl: group.profileImageUrl,
      coverImageUrl: group.coverImageUrl, topics: group.topics, joinQuestions: group.joinQuestions, memberCount: group._count.memberships,
      postCount: group._count.posts, createdAt: group.createdAt, membershipStatus: membership?.status ?? null,
      role: membership?.role ?? null, members: [], posts: [],
    } });
  }
  res.json({ data: {
    id: group.id, name: group.name, slug: group.slug, description: group.description,
    category: group.category, purpose: group.purpose, visibility: group.visibility,
    countryCode: group.countryCode, language: group.language, profileImageUrl: group.profileImageUrl,
    coverImageUrl: group.coverImageUrl, topics: group.topics, joinQuestions: group.joinQuestions, memberCount: group._count.memberships,
    postCount: group._count.posts, createdAt: group.createdAt, membershipStatus: membership?.status ?? null,
    role: membership?.role ?? null,
    members: group.memberships.map(({ user }) => user),
    posts: group.posts.map((post) => ({ ...post, likedByMe: false, followingByMe: false, comments: [] })),
  } });
});

export const recommendedSpaces = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const [profile, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: viewerId },
      select: {
        countryCode: true,
        profile: { select: { interests: true, industries: true, professionalIdentities: true } },
        professionalProfile: { select: { skills: true } },
      },
    }),
    prisma.communitySpaceMember.findMany({
      where: { userId: viewerId },
      select: { spaceId: true, status: true },
    }),
  ]);
  const memberSpaceIds = new Set(memberships.filter((membership) => membership.status === "ACTIVE" || membership.status === "MUTED").map((membership) => membership.spaceId));
  const interests = new Set([
    ...(profile?.profile?.interests ?? []),
    ...(profile?.profile?.industries ?? []),
    ...(profile?.profile?.professionalIdentities ?? []),
    ...(profile?.professionalProfile?.skills ?? []),
  ].map((item) => item.trim().toLowerCase()).filter(Boolean));
  const groups = await prisma.communitySpace.findMany({
    where: { visibility: "PUBLIC", id: { notIn: [...memberSpaceIds] } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { _count: { select: {
      posts: true,
      memberships: { where: { status: { in: ["ACTIVE", "MUTED"] } } },
    } } },
  });
  const recommendations = groups.map((group) => {
    const shared = group.topics.filter((topic) => interests.has(topic.trim().toLowerCase()));
    const sameRegion = Boolean(profile?.countryCode && group.countryCode === profile.countryCode);
    const score = Math.min(99, Math.round((shared.length / Math.max(1, Math.min(5, interests.size))) * 80 + (sameRegion ? 14 : 0) + (group.purpose.toLowerCase() === "opportunities" && interests.has("opportunities") ? 5 : 0)));
    return {
      id: group.id, name: group.name, slug: group.slug, description: group.description,
      category: group.category, purpose: group.purpose, visibility: group.visibility,
      countryCode: group.countryCode, language: group.language, profileImageUrl: group.profileImageUrl,
      coverImageUrl: group.coverImageUrl, topics: group.topics, memberCount: group._count.memberships,
      postCount: group._count.posts, membershipStatus: memberships.find((membership) => membership.spaceId === group.id)?.status ?? null,
      following: false, relevance: score,
      reasons: [
        ...(shared.length ? [`Shared interests: ${shared.slice(0, 4).join(", ")}`] : []),
        ...(sameRegion ? [`Same region: ${group.countryCode}`] : []),
      ],
    };
  }).filter((group) => group.relevance > 0).sort((a, b) => b.relevance - a.relevance).slice(0, 20);
  res.json({ data: recommendations });
});

export const updateSpace = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  const actor = await requireSpaceModerator(group.id, actorId);
  if (req.body.visibility !== undefined && actor.role === "MODERATOR") {
    throw new BadRequestError("Only owners and admins can change group visibility");
  }
  const updated = await prisma.communitySpace.update({
    where: { id: group.id },
    data: {
      ...(req.body.name !== undefined ? { name: req.body.name.trim() } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description.trim() } : {}),
      ...(req.body.category !== undefined ? { category: req.body.category.trim() } : {}),
      ...(req.body.purpose !== undefined ? { purpose: req.body.purpose } : {}),
      ...(req.body.visibility !== undefined ? { visibility: req.body.visibility } : {}),
      ...(req.body.countryCode !== undefined ? { countryCode: req.body.countryCode || null } : {}),
      ...(req.body.language !== undefined ? { language: req.body.language.trim() } : {}),
      ...(req.body.profileImageUrl !== undefined ? { profileImageUrl: req.body.profileImageUrl || null } : {}),
      ...(req.body.coverImageUrl !== undefined ? { coverImageUrl: req.body.coverImageUrl || null } : {}),
      ...(req.body.topics !== undefined ? { topics: req.body.topics } : {}),
      ...(req.body.joinQuestions !== undefined ? { joinQuestions: req.body.joinQuestions } : {}),
    },
    select: { id: true, name: true, slug: true },
  });
  res.json({ data: updated });
});

export const spaceReports = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  await requireSpaceModerator(group.id, actorId);
  const reports = await prisma.communityReport.findMany({
    where: {
      status: "OPEN",
      OR: [
        { post: { is: { communitySlug: req.params.slug } } },
        { comment: { is: { post: { is: { communitySlug: req.params.slug } } } } },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      reporter: { select: { id: true, fullName: true, avatarUrl: true } },
      post: { select: { id: true, content: true, removedAt: true, lockedAt: true, author: { select: { id: true, fullName: true } } } },
      comment: { select: { id: true, content: true, removedAt: true, postId: true, author: { select: { id: true, fullName: true } } } },
    },
  });
  res.json({ data: reports.map((report) => ({
    id: report.id, reason: report.reason, details: report.details, createdAt: report.createdAt,
    reporter: report.reporter, post: report.post, comment: report.comment,
  })) });
});

export const moderateSpaceReport = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  await requireSpaceModerator(group.id, actorId);
  const report = await prisma.communityReport.findFirst({
    where: {
      id: req.params.reportId,
      status: "OPEN",
      OR: [
        { post: { is: { communitySlug: req.params.slug } } },
        { comment: { is: { post: { is: { communitySlug: req.params.slug } } } } },
      ],
    },
    select: { id: true, postId: true, commentId: true },
  });
  if (!report) throw new NotFoundError("Report not found");
  const { action, note } = req.body;
  if (action === "LOCK_POST" || action === "UNLOCK_POST") {
    if (!report.postId) throw new BadRequestError("This report does not refer to a post");
    await prisma.$transaction([
      prisma.communityPost.update({
        where: { id: report.postId },
        data: { lockedAt: action === "LOCK_POST" ? new Date() : null, moderationNote: note || null },
      }),
      prisma.communityReport.update({ where: { id: report.id }, data: { status: "REVIEWED" } }),
    ]);
  } else if (action === "REMOVE_CONTENT") {
    await prisma.$transaction(async (tx) => {
      if (report.postId) {
        await tx.communityPost.update({
          where: { id: report.postId },
          data: { removedAt: new Date(), moderationNote: note || "Removed by group moderation" },
        });
      } else if (report.commentId) {
        await tx.communityComment.update({ where: { id: report.commentId }, data: { removedAt: new Date() } });
      }
      await tx.communityReport.update({ where: { id: report.id }, data: { status: "RESOLVED" } });
    });
  } else {
    await prisma.communityReport.update({
      where: { id: report.id },
      data: { status: action === "DISMISS" ? "DISMISSED" : "RESOLVED" },
    });
  }
  res.json({ data: { updated: true } });
});

export const deleteSpace = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, memberships: { where: { userId: actorId }, select: { role: true } } },
  });
  if (!group || group.memberships[0]?.role !== "OWNER") throw new NotFoundError("Community not found");
  await prisma.communitySpace.delete({ where: { id: group.id } });
  res.status(204).end();
});

export const transferSpaceOwnership = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  const owner = await prisma.communitySpaceMember.findUnique({
    where: { spaceId_userId: { spaceId: group.id, userId: actorId } },
    select: { role: true, status: true },
  });
  if (owner?.role !== "OWNER" || owner.status !== "ACTIVE") throw new NotFoundError("Community not found");
  const newOwner = await prisma.communitySpaceMember.findUnique({
    where: { spaceId_userId: { spaceId: group.id, userId: req.body.userId } },
    select: { id: true, status: true },
  });
  if (!newOwner || newOwner.status !== "ACTIVE" || req.body.userId === actorId) {
    throw new BadRequestError("Choose another active group member");
  }
  await prisma.$transaction([
    prisma.communitySpaceMember.update({ where: { spaceId_userId: { spaceId: group.id, userId: req.body.userId } }, data: { role: "OWNER" } }),
    prisma.communitySpaceMember.update({ where: { spaceId_userId: { spaceId: group.id, userId: actorId } }, data: { role: "ADMIN" } }),
  ]);
  res.json({ data: { transferred: true } });
});

export const createSpaceInvite = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  await requireSpaceModerator(group.id, actorId);
  const token = randomBytes(32).toString("hex");
  const invite = await prisma.communitySpaceInvite.create({
    data: {
      spaceId: group.id,
      createdById: actorId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: req.body.expiresInDays ? new Date(Date.now() + req.body.expiresInDays * 86_400_000) : null,
      maxUses: req.body.maxUses ?? null,
      approvalRequired: req.body.approvalRequired ?? false,
    },
    select: { id: true, expiresAt: true, maxUses: true, approvalRequired: true },
  });
  res.status(201).json({ data: { ...invite, token } });
});

export const spaceInvites = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  await requireSpaceModerator(group.id, actorId);
  const invites = await prisma.communitySpaceInvite.findMany({
    where: { spaceId: group.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, expiresAt: true, maxUses: true, useCount: true, approvalRequired: true, createdAt: true },
  });
  res.json({ data: invites });
});

export const revokeSpaceInvite = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  await requireSpaceModerator(group.id, actorId);
  const result = await prisma.communitySpaceInvite.updateMany({
    where: { id: req.params.inviteId, spaceId: group.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) throw new NotFoundError("Invite not found");
  res.json({ data: { revoked: true } });
});

export const acceptSpaceInvite = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const tokenHash = createHash("sha256").update(req.params.token).digest("hex");
  const invite = await prisma.communitySpaceInvite.findUnique({
    where: { tokenHash },
    select: { id: true, spaceId: true, expiresAt: true, maxUses: true, useCount: true, approvalRequired: true, revokedAt: true, space: { select: { slug: true, visibility: true, joinQuestions: true } } },
  });
  if (!invite || invite.revokedAt || (invite.expiresAt && invite.expiresAt <= new Date()) || (invite.maxUses !== null && invite.useCount >= invite.maxUses)) {
    throw new NotFoundError("This invite is invalid or has expired");
  }
  const membership = await prisma.communitySpaceMember.findUnique({
    where: { spaceId_userId: { spaceId: invite.spaceId, userId: actorId } },
    select: { status: true },
  });
  if (membership?.status === "BANNED" || membership?.status === "SUSPENDED") throw new BadRequestError("You cannot join this group");
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  if ((invite.space.visibility === "PRIVATE" || invite.approvalRequired) && invite.space.joinQuestions.length && (
    answers.length !== invite.space.joinQuestions.length || answers.some((answer: unknown) => typeof answer !== "string" || !answer.trim())
  )) {
    throw new BadRequestError("Please answer all group membership questions");
  }
  const nextStatus = invite.approvalRequired || invite.space.visibility === "PRIVATE" ? "PENDING" : "ACTIVE";
  const result = await prisma.$transaction(async (tx) => {
    const used = await tx.communitySpaceInvite.updateMany({
      where: {
        id: invite.id,
        revokedAt: null,
        ...(invite.maxUses !== null ? { useCount: { lt: invite.maxUses } } : {}),
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      data: { useCount: { increment: 1 } },
    });
    if (!used.count) throw new ConflictError("This invite has reached its use limit");
    await tx.communitySpaceMember.upsert({
      where: { spaceId_userId: { spaceId: invite.spaceId, userId: actorId } },
      create: { spaceId: invite.spaceId, userId: actorId, status: nextStatus, joinAnswers: answers.length ? answers : undefined },
      update: { status: nextStatus, joinAnswers: answers.length ? answers : undefined },
    });
    return { status: nextStatus, slug: invite.space.slug };
  });
  res.json({ data: result });
});

export const previewSpaceInvite = asyncHandler(async (req: Request, res: Response) => {
  const tokenHash = createHash("sha256").update(req.params.token).digest("hex");
  const invite = await prisma.communitySpaceInvite.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true, maxUses: true, useCount: true, approvalRequired: true, revokedAt: true,
      space: { select: { name: true, slug: true, description: true, profileImageUrl: true, visibility: true, joinQuestions: true } },
    },
  });
  if (!invite || invite.revokedAt || (invite.expiresAt && invite.expiresAt <= new Date()) || (invite.maxUses !== null && invite.useCount >= invite.maxUses)) {
    throw new NotFoundError("This invite is invalid or has expired");
  }
  res.json({ data: {
    ...invite.space,
    approvalRequired: invite.approvalRequired || invite.space.visibility === "PRIVATE",
    joinQuestions: invite.approvalRequired || invite.space.visibility === "PRIVATE" ? invite.space.joinQuestions : [],
  } });
});

export const listSpaceEvents = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true, visibility: true } });
  if (!group || group.visibility !== "PUBLIC") {
    if (!group) throw new NotFoundError("Community not found");
    await requireSpaceMembership(group.id, viewerId);
  }
  const events = await prisma.communitySpaceEvent.findMany({
    where: { spaceId: group.id },
    orderBy: { startsAt: "asc" },
    take: 100,
    include: {
      creator: { select: { id: true, fullName: true, avatarUrl: true } },
      attendees: { where: { userId: viewerId }, select: { status: true } },
    },
  });
  const eventIds = events.map((event) => event.id);
  const rsvpCounts = eventIds.length ? await prisma.communitySpaceEventRsvp.groupBy({
    by: ["eventId", "status"],
    where: { eventId: { in: eventIds } },
    _count: { _all: true },
  }) : [];
  const countsByEvent = new Map<string, { going: number; interested: number }>();
  for (const count of rsvpCounts) {
    const current = countsByEvent.get(count.eventId) ?? { going: 0, interested: 0 };
    if (count.status === "GOING") current.going = count._count._all;
    else current.interested = count._count._all;
    countsByEvent.set(count.eventId, current);
  }
  res.json({ data: events.map(({ attendees, ...event }) => ({
    ...event, ...(countsByEvent.get(event.id) ?? { going: 0, interested: 0 }),
    myRsvp: attendees[0]?.status ?? null,
  })) });
});

export const createSpaceEvent = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  await requireActiveSpaceMember(group.id, actorId);
  const event = await prisma.communitySpaceEvent.create({
    data: {
      spaceId: group.id, creatorId: actorId, title: req.body.title, description: req.body.description,
      kind: req.body.kind, startsAt: new Date(req.body.startsAt), endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null,
      timezone: req.body.timezone, location: req.body.location || null, meetingUrl: req.body.meetingUrl || null,
      capacity: req.body.capacity ?? null,
    },
  });
  res.status(201).json({ data: { ...event, going: 0, interested: 0, myRsvp: null } });
});

export const rsvpSpaceEvent = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const event = await prisma.communitySpaceEvent.findUnique({
    where: { id: req.params.eventId },
    select: { id: true, spaceId: true, capacity: true, status: true, space: { select: { slug: true } } },
  });
  if (!event || event.space.slug !== req.params.slug) throw new NotFoundError("Event not found");
  await requireSpaceMembership(event.spaceId, actorId);
  if (req.body.status && event.status !== "SCHEDULED") throw new BadRequestError("This event is not accepting RSVPs");
  const rsvpStatus = await prisma.$transaction(async (tx) => {
    const previous = await tx.communitySpaceEventRsvp.findUnique({
      where: { eventId_userId: { eventId: event.id, userId: actorId } },
      select: { status: true },
    });
    if (req.body.status === "GOING" && previous?.status !== "GOING" && event.capacity) {
      const attendeeCount = await tx.communitySpaceEventRsvp.count({ where: { eventId: event.id, status: "GOING" } });
      if (attendeeCount >= event.capacity) throw new ConflictError("This event is full");
    }
    if (!req.body.status) {
      await tx.communitySpaceEventRsvp.deleteMany({ where: { eventId: event.id, userId: actorId } });
      return null;
    }
    const rsvp = await tx.communitySpaceEventRsvp.upsert({
      where: { eventId_userId: { eventId: event.id, userId: actorId } },
      create: { eventId: event.id, userId: actorId, status: req.body.status },
      update: { status: req.body.status },
    });
    return rsvp.status;
  }, { isolationLevel: "Serializable" });
  res.json({ data: { status: rsvpStatus } });
});

export const updateSpaceEvent = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const event = await prisma.communitySpaceEvent.findUnique({
    where: { id: req.params.eventId }, select: { id: true, spaceId: true, creatorId: true, startsAt: true, endsAt: true, space: { select: { slug: true } } },
  });
  if (!event || event.space.slug !== req.params.slug) throw new NotFoundError("Event not found");
  const membership = await requireActiveSpaceMember(event.spaceId, actorId);
  if (event.creatorId !== actorId && !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) throw new NotFoundError("Event not found");
  const nextStart = req.body.startsAt ? new Date(req.body.startsAt) : event.startsAt;
  const nextEnd = req.body.endsAt !== undefined ? (req.body.endsAt ? new Date(req.body.endsAt) : null) : event.endsAt;
  if (nextEnd && nextEnd <= nextStart) throw new BadRequestError("Event end time must be after its start time");
  const updated = await prisma.communitySpaceEvent.update({
    where: { id: event.id },
    data: {
      ...(req.body.title !== undefined ? { title: req.body.title } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      ...(req.body.kind !== undefined ? { kind: req.body.kind } : {}),
      ...(req.body.startsAt !== undefined ? { startsAt: new Date(req.body.startsAt) } : {}),
      ...(req.body.endsAt !== undefined ? { endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null } : {}),
      ...(req.body.location !== undefined ? { location: req.body.location || null } : {}),
      ...(req.body.meetingUrl !== undefined ? { meetingUrl: req.body.meetingUrl || null } : {}),
      ...(req.body.capacity !== undefined ? { capacity: req.body.capacity } : {}),
      ...(req.body.status !== undefined ? { status: req.body.status } : {}),
    },
  });
  res.json({ data: updated });
});

export const listSpaceProjects = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true, visibility: true } });
  if (!group || group.visibility !== "PUBLIC") {
    if (!group) throw new NotFoundError("Community not found");
    await requireSpaceMembership(group.id, viewerId);
  }
  const projects = await prisma.communitySpaceProject.findMany({
    where: { spaceId: group.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      creator: { select: { id: true, fullName: true, avatarUrl: true } },
      members: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
    },
  });
  res.json({ data: projects.map((project) => ({
    ...project, memberCount: project.members.length,
    joined: project.members.some((member) => member.userId === viewerId),
  })) });
});

export const listSpaceAchievements = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true, visibility: true } });
  if (!group) throw new NotFoundError("Community not found");
  if (group.visibility !== "PUBLIC") await requireSpaceMembership(group.id, viewerId);
  const memberships = await prisma.communitySpaceMember.findMany({
    where: { spaceId: group.id, status: { in: ["ACTIVE", "MUTED"] } },
    select: { userId: true },
  });
  const achievements = await prisma.verifiedAchievement.findMany({
    where: { userId: { in: memberships.map((membership) => membership.userId) } },
    orderBy: { issuedAt: "desc" },
    take: 100,
    select: {
      id: true, title: true, description: true, issuedAt: true, points: true,
      user: { select: { id: true, fullName: true, avatarUrl: true } },
      opportunity: { select: { id: true, slug: true, title: true } },
      organization: { select: { id: true, name: true } },
    },
  });
  res.json({ data: achievements });
});

export const createSpaceProject = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const group = await prisma.communitySpace.findUnique({ where: { slug: req.params.slug }, select: { id: true } });
  if (!group) throw new NotFoundError("Community not found");
  await requireActiveSpaceMember(group.id, actorId);
  const project = await prisma.communitySpaceProject.create({
    data: {
      spaceId: group.id, creatorId: actorId, title: req.body.title, description: req.body.description,
      skillsNeeded: req.body.skillsNeeded,
      members: { create: { userId: actorId, role: "FOUNDER" } },
    },
    include: { creator: { select: { id: true, fullName: true, avatarUrl: true } }, members: true },
  });
  res.status(201).json({ data: { ...project, memberCount: project.members.length, joined: true } });
});

export const joinSpaceProject = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const project = await prisma.communitySpaceProject.findUnique({
    where: { id: req.params.projectId }, select: { id: true, spaceId: true, status: true, space: { select: { slug: true } } },
  });
  if (!project || project.space.slug !== req.params.slug || project.status === "ARCHIVED") throw new NotFoundError("Project not found");
  await requireActiveSpaceMember(project.spaceId, actorId);
  if (project.status !== "OPEN") throw new BadRequestError("This project is not accepting collaborators");
  await prisma.communitySpaceProjectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: actorId } },
    create: { projectId: project.id, userId: actorId, role: req.body.role },
    update: { role: req.body.role },
  });
  res.json({ data: { joined: true } });
});

export const updateSpaceProject = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const project = await prisma.communitySpaceProject.findUnique({
    where: { id: req.params.projectId }, select: { id: true, creatorId: true, spaceId: true, space: { select: { slug: true } } },
  });
  if (!project || project.space.slug !== req.params.slug) throw new NotFoundError("Project not found");
  const membership = await requireActiveSpaceMember(project.spaceId, actorId);
  if (project.creatorId !== actorId && !["OWNER", "ADMIN", "MODERATOR"].includes(membership.role)) throw new NotFoundError("Project not found");
  const updated = await prisma.communitySpaceProject.update({
    where: { id: project.id },
    data: {
      ...(req.body.title !== undefined ? { title: req.body.title } : {}),
      ...(req.body.description !== undefined ? { description: req.body.description } : {}),
      ...(req.body.skillsNeeded !== undefined ? { skillsNeeded: req.body.skillsNeeded } : {}),
      ...(req.body.status !== undefined ? { status: req.body.status } : {}),
    },
  });
  res.json({ data: updated });
});

export const leaveSpaceProject = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const project = await prisma.communitySpaceProject.findUnique({
    where: { id: req.params.projectId }, select: { id: true, creatorId: true, spaceId: true, space: { select: { slug: true } } },
  });
  if (!project || project.space.slug !== req.params.slug) throw new NotFoundError("Project not found");
  await requireSpaceMembership(project.spaceId, actorId);
  if (project.creatorId === actorId) throw new BadRequestError("Project founders cannot leave their project");
  await prisma.communitySpaceProjectMember.deleteMany({ where: { projectId: project.id, userId: actorId } });
  res.json({ data: { joined: false } });
});

export const joinSpace = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const group = await prisma.communitySpace.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, visibility: true, joinQuestions: true },
  });
  if (!group || group.visibility === "HIDDEN") throw new NotFoundError("Community not found");
  const currentMembership = await prisma.communitySpaceMember.findUnique({
    where: { spaceId_userId: { spaceId: group.id, userId: viewerId } },
    select: { status: true },
  });
  if (currentMembership?.status === "BANNED" || currentMembership?.status === "SUSPENDED") {
    throw new BadRequestError("You cannot join this group");
  }
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  if (group.visibility === "PRIVATE" && group.joinQuestions.length && (
    answers.length !== group.joinQuestions.length || answers.some((answer: unknown) => typeof answer !== "string" || !answer.trim())
  )) {
    throw new BadRequestError("Please answer all group membership questions");
  }
  const status = group.visibility === "PRIVATE" ? "PENDING" : "ACTIVE";
  await prisma.communitySpaceMember.upsert({
    where: { spaceId_userId: { spaceId: group.id, userId: viewerId } },
    create: { spaceId: group.id, userId: viewerId, status, joinAnswers: answers.length ? answers : undefined },
    update: { status, joinAnswers: answers.length ? answers : undefined },
  });
  res.status(status === "PENDING" ? 202 : 200).json({ data: { status } });
});

export const spaceMembers = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const space = await prisma.communitySpace.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, visibility: true },
  });
  if (!space) throw new NotFoundError("Community not found");
  const ownMembership = await prisma.communitySpaceMember.findUnique({
    where: { spaceId_userId: { spaceId: space.id, userId: viewerId } },
    select: { status: true, role: true },
  });
  if (space.visibility !== "PUBLIC" && ownMembership?.status !== "ACTIVE" && ownMembership?.status !== "MUTED") {
    throw new NotFoundError("Community not found");
  }
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const memberType = req.query.type;
  const memberStatuses = ["ACTIVE", "PENDING", "MUTED", "SUSPENDED", "BANNED"] as const;
  const memberStatus = memberStatuses.find((status) => status === req.query.status) ?? "ACTIVE";
  const userFilters: Prisma.UserWhereInput[] = [];
  if (query) userFilters.push({ OR: [
    { fullName: { contains: query, mode: "insensitive" } },
    { countryCode: { contains: query, mode: "insensitive" } },
    { profile: { is: { headline: { contains: query, mode: "insensitive" } } } },
    { profile: { is: { username: { contains: query, mode: "insensitive" } } } },
    { profile: { is: { interests: { has: query } } } },
    { profile: { is: { industries: { has: query } } } },
    { professionalProfile: { is: { profession: { contains: query, mode: "insensitive" } } } },
    { professionalProfile: { is: { skills: { has: query } } } },
    { businessProfile: { is: { industry: { contains: query, mode: "insensitive" } } } },
  ] });
  if (memberType === "DEVELOPERS") userFilters.push({ OR: [
    { professionalProfile: { is: { profession: { contains: "developer", mode: "insensitive" } } } },
    { profile: { is: { professionalIdentities: { has: "Developer" } } } },
  ] });
  if (memberType === "FOUNDERS") userFilters.push({ businessProfile: { isNot: null } });
  if (memberType === "STUDENTS") userFilters.push({ profile: { is: { userType: "STUDENT" } } });
  if (memberType === "RESEARCHERS") userFilters.push({ profile: { is: { userType: "RESEARCHER" } } });
  if (memberType === "ORGANIZATIONS") userFilters.push({ organizationMembers: { some: {} } });
  if (memberStatus !== "ACTIVE" && !["OWNER", "ADMIN", "MODERATOR"].includes(ownMembership?.role ?? "")) {
    throw new NotFoundError("Community not found");
  }
  const members = await prisma.communitySpaceMember.findMany({
    where: {
      spaceId: space.id,
      status: memberStatus,
      ...(memberType === "CONTRIBUTORS" ? { role: "CONTRIBUTOR" as const } : {}),
      ...(userFilters.length ? { user: { is: { AND: userFilters } } } : {}),
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    take: 100,
    include: {
      user: {
        select: {
          id: true, fullName: true, avatarUrl: true, countryCode: true,
          profile: { select: { username: true, headline: true, interests: true, industries: true } },
          professionalProfile: { select: { profession: true, skills: true } },
        },
      },
    },
  });
  res.json({ data: members.map(({ user, role, status, joinAnswers }) => ({ ...user, role, status, ...(status === "PENDING" ? { joinAnswers } : {}) })) });
});

export const moderateSpaceMember = asyncHandler(async (req: Request, res: Response) => {
  const actorId = userId(req);
  const { slug, userId: targetId } = req.params;
  const { action } = req.body;
  const group = await prisma.communitySpace.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!group) throw new NotFoundError("Community not found");
  const [actor, target] = await Promise.all([
    prisma.communitySpaceMember.findUnique({
      where: { spaceId_userId: { spaceId: group.id, userId: actorId } },
      select: { role: true, status: true },
    }),
    prisma.communitySpaceMember.findUnique({
      where: { spaceId_userId: { spaceId: group.id, userId: targetId } },
      select: { id: true, role: true, status: true },
    }),
  ]);
  if (!actor || actor.status !== "ACTIVE" || !["OWNER", "ADMIN", "MODERATOR"].includes(actor.role)) {
    throw new NotFoundError("Community member not found");
  }
  if (!target) throw new NotFoundError("Community member not found");
  if (
    target.role === "OWNER"
    || (target.role === "ADMIN" && actor.role !== "OWNER")
    || (actor.role === "MODERATOR" && target.role === "MODERATOR")
  ) {
    throw new BadRequestError("You do not have permission to manage this member");
  }
  if (action === "APPROVE" && target.status === "PENDING") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
  } else if (action === "REJECT" && target.status === "PENDING") {
    await prisma.communitySpaceMember.delete({ where: { id: target.id } });
  } else if (action === "MUTE" && target.status === "ACTIVE") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "MUTED" } });
  } else if (action === "UNMUTE" && target.status === "MUTED") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
  } else if (action === "SUSPEND" && ["ACTIVE", "MUTED"].includes(target.status) && actor.role !== "MODERATOR") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "SUSPENDED" } });
  } else if (action === "UNSUSPEND" && target.status === "SUSPENDED" && actor.role !== "MODERATOR") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
  } else if (action === "BAN" && target.status !== "BANNED" && actor.role !== "MODERATOR") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "BANNED" } });
  } else if (action === "UNBAN" && target.status === "BANNED" && actor.role !== "MODERATOR") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "ACTIVE" } });
  } else if (action === "PROMOTE_MODERATOR" && actor.role !== "MODERATOR" && target.role === "MEMBER") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { role: "MODERATOR" } });
  } else if (action === "DEMOTE_MODERATOR" && actor.role !== "MODERATOR" && target.role === "MODERATOR") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { role: "MEMBER" } });
  } else if (action === "PROMOTE_ADMIN" && actor.role === "OWNER" && ["MEMBER", "CONTRIBUTOR", "MODERATOR"].includes(target.role)) {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { role: "ADMIN" } });
  } else if (action === "DEMOTE_ADMIN" && actor.role === "OWNER" && target.role === "ADMIN") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { role: "MEMBER" } });
  } else if (action === "PROMOTE_CONTRIBUTOR" && actor.role !== "MODERATOR" && target.role === "MEMBER") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { role: "CONTRIBUTOR" } });
  } else if (action === "DEMOTE_CONTRIBUTOR" && actor.role !== "MODERATOR" && target.role === "CONTRIBUTOR") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { role: "MEMBER" } });
  } else {
    throw new BadRequestError("That member action is not allowed for their current status");
  }
  res.json({ data: { updated: true } });
});

export const leaveSpace = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const group = await prisma.communitySpace.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, memberships: { where: { userId: viewerId }, select: { role: true } } },
  });
  if (!group) throw new NotFoundError("Community not found");
  if (group.memberships.some((membership) => membership.role === "OWNER")) {
    throw new BadRequestError("Transfer group ownership before leaving this group");
  }
  await prisma.communitySpaceMember.deleteMany({
    where: { spaceId: group.id, userId: viewerId, role: { not: "OWNER" } },
  });
  res.json({ data: { status: null } });
});

export const connectionRequests = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const requests = await prisma.communityConnection.findMany({
    where: { status: "PENDING", OR: [{ requesterId: viewerId }, { recipientId: viewerId }] },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      requester: { select: authorSelect },
      recipient: { select: authorSelect },
    },
  });
  res.json({ data: requests.map((item) => ({
    id: item.id,
    status: item.status,
    createdAt: item.createdAt,
    direction: item.requesterId === viewerId ? "sent" : "received",
    person: item.requesterId === viewerId ? item.recipient : item.requester,
  })) });
});

export const acceptedConnections = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const [rows, blocks] = await Promise.all([
    prisma.communityConnection.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: viewerId }, { recipientId: viewerId }] },
      orderBy: { respondedAt: "desc" },
      take: 200,
      include: {
        requester: { select: authorSelect },
        recipient: { select: authorSelect },
      },
    }),
    prisma.communityUserAction.findMany({
      where: { kind: "BLOCK", OR: [{ actorId: viewerId }, { targetId: viewerId }] },
      select: { actorId: true, targetId: true },
    }),
  ]);
  const blockedIds = new Set(blocks.map((item) => item.actorId === viewerId ? item.targetId : item.actorId));
  res.json({ data: rows
    .filter((item) => !blockedIds.has(item.requesterId === viewerId ? item.recipientId : item.requesterId))
    .map((item) => ({
    id: item.id,
    connectedAt: item.respondedAt ?? item.createdAt,
    person: item.requesterId === viewerId ? item.recipient : item.requester,
  })) });
});

export const requestConnection = asyncHandler(async (req: Request, res: Response) => {
  const requesterId = userId(req);
  const recipientId = req.params.userId;
  if (requesterId === recipientId) throw new BadRequestError("You cannot connect with yourself");
  const recipient = await withMissingSchemaFallback(
    () => prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, status: true, profile: { select: { visibility: true, visibilityRules: true } } },
    }),
    null,
  );
  if (!recipient || recipient.status !== "ACTIVE") throw new NotFoundError("User not found");
  if ((recipient.profile?.visibility ?? "PUBLIC") === "PRIVATE") throw new NotFoundError("User not found");
  const visibilityRules = recipient.profile?.visibilityRules && typeof recipient.profile.visibilityRules === "object" && !Array.isArray(recipient.profile.visibilityRules)
    ? recipient.profile.visibilityRules as Record<string, unknown>
    : {};
  const connectionPolicy = visibilityRules.connectionPolicy ?? "ANYONE";
  if (connectionPolicy === "NOBODY") throw new BadRequestError("This member is not accepting connection requests");
  if (connectionPolicy === "FOLLOWERS") {
    const follows = await prisma.communityFollow.findUnique({
      where: { userId_targetType_targetKey: { userId: recipientId, targetType: "USER", targetKey: requesterId } },
      select: { id: true },
    });
    if (!follows) throw new BadRequestError("Follow this member before requesting a connection");
  }
  const prior = await prisma.communityConnection.findFirst({
    where: {
      OR: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    },
  });
  if (prior?.status === "ACCEPTED") return res.json({ data: { id: prior.id, status: "ACCEPTED" } });
  if (prior?.status === "PENDING") return res.json({ data: { id: prior.id, status: "PENDING" } });
  const connection = prior
    ? await prisma.communityConnection.update({
        where: { id: prior.id },
        data: { requesterId, recipientId, status: "PENDING", respondedAt: null, createdAt: new Date() },
      })
    : await prisma.communityConnection.create({ data: { requesterId, recipientId } });
  res.status(201).json({ data: { id: connection.id, status: connection.status } });
});

export const respondToConnection = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const updated = await prisma.communityConnection.updateMany({
    where: { id: req.params.id, recipientId: viewerId, status: "PENDING" },
    data: { status: req.body.status, respondedAt: new Date() },
  });
  if (!updated.count) throw new NotFoundError("Pending connection request not found");
  res.json({ data: { status: req.body.status } });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  if (!Object.keys(req.body ?? {}).length) throw new BadRequestError("Provide at least one setting to update");
  const existing = await loadUserProfile(viewerId);
  const rules = existing?.visibilityRules && typeof existing.visibilityRules === "object" && !Array.isArray(existing.visibilityRules)
    ? existing.visibilityRules as Record<string, unknown>
    : {};
  const visibilityRules = req.body.connectionPolicy
    ? { ...rules, connectionPolicy: req.body.connectionPolicy }
    : rules;
  let profile: any = {
    visibility: "PRIVATE",
    analyzable: false,
    visibilityRules: {},
  };
  try {
    profile = await prisma.userProfile.upsert({
      where: { userId: viewerId },
      create: {
        userId: viewerId,
        userType: "OTHER",
        visibility: req.body.visibility ?? "PRIVATE",
        analyzable: req.body.analyzable ?? false,
        visibilityRules: req.body.connectionPolicy ? { connectionPolicy: req.body.connectionPolicy } : {},
      },
      update: {
        ...(req.body.visibility ? { visibility: req.body.visibility } : {}),
        ...(typeof req.body.analyzable === "boolean" ? { analyzable: req.body.analyzable } : {}),
        ...(req.body.connectionPolicy ? { visibilityRules: visibilityRules as Prisma.InputJsonValue } : {}),
      },
      select: { visibility: true, analyzable: true, visibilityRules: true },
    });
  } catch (error) {
    if (!isMissingSchemaError(error)) throw error;
  }
  const actions = await withMissingSchemaFallback(
    () => prisma.communityUserAction.findMany({
      where: { actorId: viewerId },
      include: { target: { select: { id: true, fullName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
    }),
    [],
  );
  const storedRules = profile.visibilityRules && typeof profile.visibilityRules === "object" && !Array.isArray(profile.visibilityRules)
    ? profile.visibilityRules as Record<string, unknown>
    : {};
  res.json({ data: {
    visibility: profile.visibility,
    analyzable: profile.analyzable,
    connectionPolicy: storedRules.connectionPolicy ?? "ANYONE",
    blocked: actions.filter((item) => item.kind === "BLOCK").map((item) => item.target),
    muted: actions.filter((item) => item.kind === "MUTE").map((item) => item.target),
  } });
});

export const settings = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const [profile, actions] = await Promise.all([
    loadUserProfile(viewerId),
    withMissingSchemaFallback(
      () => prisma.communityUserAction.findMany({
        where: { actorId: viewerId },
        include: { target: { select: { id: true, fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
      }),
      [],
    ),
  ]);
  const rules = profile?.visibilityRules && typeof profile.visibilityRules === "object" && !Array.isArray(profile.visibilityRules)
    ? profile.visibilityRules as Record<string, unknown>
    : {};
  res.json({ data: {
    visibility: profile?.visibility ?? "PRIVATE",
    analyzable: profile?.analyzable ?? false,
    connectionPolicy: rules.connectionPolicy ?? "ANYONE",
    blocked: actions.filter((item) => item.kind === "BLOCK").map((item) => item.target),
    muted: actions.filter((item) => item.kind === "MUTE").map((item) => item.target),
  } });
});

export const analyzeProfile = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const user = await loadUserWithProfile(viewerId);
  if (!user) throw new UnauthorizedError();
  const profileSettings = (user as any).profile ?? { analyzable: false, headline: null, bio: null, industries: [], interests: [] };
  if (!profileSettings.analyzable) throw new BadRequestError("Enable profile analysis in your community settings first");
  const profileSignals = {
    headline: profileSettings.headline,
    bio: profileSettings.bio,
    countryCode: user.countryCode,
    industries: profileSettings.industries,
    interests: profileSettings.interests,
    skills: user.professionalProfile?.skills ?? [],
    profession: user.professionalProfile?.profession ?? null,
    certifications: user.professionalProfile?.certifications ?? [],
    education: user.studentProfile ? {
      level: user.studentProfile.educationLevel,
      field: user.studentProfile.fieldOfStudy,
    } : null,
    businessIndustry: user.businessProfile?.industry ?? null,
  };
  const profileHash = createHash("sha256").update(JSON.stringify(profileSignals)).digest("hex");
  const cached = await prisma.profileAnalysis.findFirst({
    where: { userId: viewerId, profileHash },
    orderBy: { createdAt: "desc" },
  });
  if (cached) return res.json({ data: cached });
  const result = await runAi({
    taskType: "RECOMMENDATIONS",
    promptVersion: "profile-intelligence-v1",
    responseFormat: "json",
    systemPrompt: "Analyze a Scout member's voluntarily supplied professional profile. Return JSON with strengths, concerns, recommended opportunity areas, connection types, and next steps. Do not infer protected traits. Be specific, respectful, and state that recommendations are not guarantees.",
    userPrompt: JSON.stringify(profileSignals),
    maxTokens: 900,
  });
  const analysis = await prisma.profileAnalysis.create({
    data: {
      userId: viewerId,
      profileHash,
      result: {
        ...(result.output && typeof result.output === "object" ? result.output as Record<string, unknown> : { summary: result.outputText }),
        provider: result.provider,
        fallbackUsed: result.fallbackUsed,
        disclaimer: result.provider === "mock"
          ? "This is a deterministic offline fallback, not an AI assessment. Configure an AI provider for profile-specific analysis."
          : "AI-generated guidance can be incomplete. Verify it against your experience and official opportunity requirements.",
      },
      provider: result.provider,
    },
  });
  res.status(201).json({ data: analysis });
});

export const profile = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const targetId = req.params.userId;
  const person: any = await loadUserWithProfile(targetId);
  if (!person || person.status !== "ACTIVE") throw new NotFoundError("Profile not found");
  const profileVisibility = person.profile?.visibility ?? "PUBLIC";
  if (targetId !== viewerId && profileVisibility !== "PUBLIC") {
    const [follows, connection] = await Promise.all([
      prisma.communityFollow.findUnique({
        where: { userId_targetType_targetKey: { userId: viewerId, targetType: "USER", targetKey: targetId } },
        select: { id: true },
      }),
      prisma.communityConnection.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { requesterId: viewerId, recipientId: targetId },
            { requesterId: targetId, recipientId: viewerId },
          ],
        },
        select: { id: true },
      }),
    ]);
    if (profileVisibility !== "FOLLOWERS" || (!follows && !connection)) {
      throw new NotFoundError("Profile not found");
    }
  }
  const [posts, followers, following, completed, connections, isFollowing, recentPosts] = await Promise.all([
    prisma.communityPost.count({ where: { authorId: targetId, removedAt: null } }),
    prisma.communityFollow.count({ where: { targetType: "USER", targetKey: targetId } }),
    prisma.communityFollow.count({ where: { userId: targetId, targetType: "USER" } }),
    prisma.opportunityInteraction.count({ where: { userId: targetId, kind: "COMPLETED" } }),
    prisma.communityConnection.count({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: targetId }, { recipientId: targetId }],
      },
    }),
    targetId === viewerId
      ? Promise.resolve(null)
      : prisma.communityFollow.findUnique({
          where: { userId_targetType_targetKey: { userId: viewerId, targetType: "USER", targetKey: targetId } },
          select: { id: true },
        }),
    prisma.communityPost.findMany({
      where: { authorId: targetId, removedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        content: true,
        kind: true,
        createdAt: true,
        opportunity: { select: { id: true, slug: true, title: true, category: true } },
        _count: { select: { comments: true, reactions: true } },
      },
    }),
  ]);
  res.json({ data: {
    id: person.id,
    fullName: person.fullName,
    avatarUrl: person.avatarUrl,
    countryCode: person.countryCode,
    following: Boolean(isFollowing),
    coverImageUrl: person.profile?.coverImageUrl ?? null,
    username: person.profile?.username ?? null,
    headline: person.profile?.headline ?? person.professionalProfile?.profession,
    bio: person.profile?.bio,
    skills: person.professionalProfile?.skills ?? [],
    interests: [...new Set([...(person.profile?.interests ?? []), ...(person.studentProfile?.interests ?? [])])],
    industries: person.profile?.industries ?? [],
    languages: person.profile?.languages ?? [],
    stats: { posts, followers, following, completed, connections },
    recentPosts,
  } });
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
  const existing = await withMissingSchemaFallback(
    () => prisma.communityUserAction.findUnique({ where }),
    null,
  );
  if (existing) {
    await withMissingSchemaFallback(
      () => prisma.communityUserAction.delete({ where: { id: existing.id } }),
      undefined,
    );
    res.json({ data: { active: false } });
  } else {
    await withMissingSchemaFallback(
      () => prisma.communityUserAction.create({ data: { actorId, targetId, kind } }),
      undefined,
    );
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
