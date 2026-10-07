import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { createHash } from "node:crypto";
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
  const where: Prisma.CommunityPostWhereInput = { authorId: { notIn: hiddenAuthors } };
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
      if (membership?.status !== "ACTIVE") throw new NotFoundError("Community not found");
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
  const allowedKinds = ["GENERAL", "OPPORTUNITY_DISCUSSION", "QUESTION", "ACHIEVEMENT", "PROJECT_ANNOUNCEMENT", "EDUCATIONAL", "INDUSTRY_DISCUSSION"];
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
      select: { status: true },
    });
    if (membership?.status !== "ACTIVE") throw new NotFoundError("Community not found");
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
  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
  if (!post) throw new NotFoundError("Post not found");
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
  const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
  if (!post) throw new NotFoundError("Post not found");
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
    select: { id: true, authorId: true },
  });
  if (!post) throw new NotFoundError("Post not found");
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
  const { name, slug, description, category, purpose, visibility, countryCode, language, profileImageUrl, coverImageUrl, topics } = req.body;
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
    postCount: space._count.posts,
    memberCount: await prisma.communitySpaceMember.count({
      where: { spaceId: space.id, status: "ACTIVE" },
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
      _count: { select: { posts: true, memberships: { where: { status: "ACTIVE" } } } },
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        take: 8,
        include: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
      },
      posts: {
        where: { author: { status: "ACTIVE" } },
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
  if (group.visibility === "HIDDEN" && membership?.status !== "ACTIVE") throw new NotFoundError("Community not found");
  if (group.visibility !== "PUBLIC" && membership?.status !== "ACTIVE" && membership?.role !== "OWNER") {
    return res.json({ data: {
      id: group.id, name: group.name, slug: group.slug, description: group.description,
      category: group.category, purpose: group.purpose, visibility: group.visibility,
      countryCode: group.countryCode, language: group.language, profileImageUrl: group.profileImageUrl,
      coverImageUrl: group.coverImageUrl, topics: group.topics, memberCount: group._count.memberships,
      postCount: group._count.posts, createdAt: group.createdAt, membershipStatus: membership?.status ?? null,
      role: membership?.role ?? null, members: [], posts: [],
    } });
  }
  res.json({ data: {
    id: group.id, name: group.name, slug: group.slug, description: group.description,
    category: group.category, purpose: group.purpose, visibility: group.visibility,
    countryCode: group.countryCode, language: group.language, profileImageUrl: group.profileImageUrl,
    coverImageUrl: group.coverImageUrl, topics: group.topics, memberCount: group._count.memberships,
    postCount: group._count.posts, createdAt: group.createdAt, membershipStatus: membership?.status ?? null,
    role: membership?.role ?? null,
    members: group.memberships.map(({ user }) => user),
    posts: group.posts.map((post) => ({ ...post, likedByMe: false, followingByMe: false, comments: [] })),
  } });
});

export const joinSpace = asyncHandler(async (req: Request, res: Response) => {
  const viewerId = userId(req);
  const group = await prisma.communitySpace.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, visibility: true },
  });
  if (!group || group.visibility === "HIDDEN") throw new NotFoundError("Community not found");
  const currentMembership = await prisma.communitySpaceMember.findUnique({
    where: { spaceId_userId: { spaceId: group.id, userId: viewerId } },
    select: { status: true },
  });
  if (currentMembership?.status === "BANNED" || currentMembership?.status === "SUSPENDED") {
    throw new BadRequestError("You cannot join this group");
  }
  const status = group.visibility === "PRIVATE" ? "PENDING" : "ACTIVE";
  await prisma.communitySpaceMember.upsert({
    where: { spaceId_userId: { spaceId: group.id, userId: viewerId } },
    create: { spaceId: group.id, userId: viewerId, status },
    update: { status },
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
  if (space.visibility !== "PUBLIC" && ownMembership?.status !== "ACTIVE") {
    throw new NotFoundError("Community not found");
  }
  const query = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const includePending = req.query.status === "PENDING";
  if (includePending && !["OWNER", "ADMIN", "MODERATOR"].includes(ownMembership?.role ?? "")) {
    throw new NotFoundError("Community not found");
  }
  const members = await prisma.communitySpaceMember.findMany({
    where: {
      spaceId: space.id,
      status: includePending ? "PENDING" : "ACTIVE",
      ...(query ? { user: { OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { profile: { is: { headline: { contains: query, mode: "insensitive" } } } },
        { professionalProfile: { is: { profession: { contains: query, mode: "insensitive" } } } },
      ] } } : {}),
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    take: 100,
    include: {
      user: {
        select: {
          id: true, fullName: true, avatarUrl: true, countryCode: true,
          profile: { select: { username: true, headline: true } },
          professionalProfile: { select: { profession: true, skills: true } },
        },
      },
    },
  });
  res.json({ data: members.map(({ user, role, status }) => ({ ...user, role, status })) });
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
  } else if (action === "SUSPEND" && target.status === "ACTIVE" && actor.role !== "MODERATOR") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "SUSPENDED" } });
  } else if (action === "BAN" && actor.role !== "MODERATOR") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { status: "BANNED" } });
  } else if (action === "PROMOTE_MODERATOR" && actor.role !== "MODERATOR" && target.role === "MEMBER") {
    await prisma.communitySpaceMember.update({ where: { id: target.id }, data: { role: "MODERATOR" } });
  } else if (action === "DEMOTE_MODERATOR" && actor.role !== "MODERATOR" && target.role === "MODERATOR") {
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
  const rows = await prisma.communityConnection.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: viewerId }, { recipientId: viewerId }] },
    orderBy: { respondedAt: "desc" },
    take: 200,
    include: {
      requester: { select: authorSelect },
      recipient: { select: authorSelect },
    },
  });
  res.json({ data: rows.map((item) => ({
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
  const [posts, followers, following, completed, recentPosts] = await Promise.all([
    prisma.communityPost.count({ where: { authorId: targetId } }),
    prisma.communityFollow.count({ where: { targetType: "USER", targetKey: targetId } }),
    prisma.communityFollow.count({ where: { userId: targetId, targetType: "USER" } }),
    prisma.opportunityInteraction.count({ where: { userId: targetId, kind: "COMPLETED" } }),
    prisma.communityPost.findMany({
      where: { authorId: targetId },
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
    username: person.profile?.username,
    headline: person.profile?.headline ?? person.professionalProfile?.profession,
    bio: person.profile?.bio,
    skills: person.professionalProfile?.skills ?? [],
    interests: [...new Set([...(person.profile?.interests ?? []), ...(person.studentProfile?.interests ?? [])])],
    industries: person.profile?.industries ?? [],
    languages: person.profile?.languages ?? [],
    stats: { posts, followers, following, completed },
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
