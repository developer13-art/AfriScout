import { Router } from "express";
import { z } from "zod";
import * as Controller from "../../controllers/community.controller";
import * as MessagingController from "../../controllers/communityMessaging.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";

const uuid = z.string().uuid();
const httpUrl = z.string().url().max(500).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "URL must use HTTP or HTTPS");
const router = Router();
router.use(authMiddleware);
router.get("/feed", Controller.feed);
router.get("/opportunities/search", validate({ query: z.object({ q: z.string().trim().max(100).optional() }) }), Controller.searchOpportunities);
router.get("/opportunities/:id/interactions", validate({ params: z.object({ id: uuid }) }), Controller.opportunityInteractionSummary);
router.post("/opportunities/:id/interactions", validate({
  params: z.object({ id: uuid }),
  body: z.object({ kind: z.enum(["INTERESTED", "APPLYING", "COMPLETED"]) }),
}), Controller.interactWithOpportunity);
router.get("/connections", Controller.connections);
router.get("/members", Controller.members);
router.get("/groups/recommended", Controller.recommendedSpaces);
router.post("/spaces", validate({ body: z.object({
  name: z.string().trim().min(3).max(80),
  slug: z.string().trim().min(3).max(64),
  description: z.string().trim().min(20).max(1000),
  category: z.string().trim().min(1).max(80),
  purpose: z.enum(["LEARNING", "NETWORKING", "COLLABORATION", "OPPORTUNITIES", "JOBS", "HACKATHONS", "GRANTS", "WEB3", "INDUSTRY", "LOCATION", "ORGANIZATION", "PROJECT", "RESEARCH", "GENERAL"]),
  visibility: z.enum(["PUBLIC", "PRIVATE", "HIDDEN"]),
  countryCode: z.string().length(2).optional().nullable(),
  language: z.string().trim().min(2).max(40),
  profileImageUrl: httpUrl.optional().nullable(),
  coverImageUrl: httpUrl.optional().nullable(),
  topics: z.array(z.string().trim().min(1).max(40)).max(12),
  joinQuestions: z.array(z.string().trim().min(1).max(240)).max(5).optional(),
}) }), Controller.createSpace);
router.get("/spaces", Controller.spaces);
router.get("/spaces/:slug", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.space);
router.patch("/spaces/:slug", validate({
  params: z.object({ slug: z.string().min(1).max(64) }),
  body: z.object({
    name: z.string().trim().min(3).max(80).optional(),
    description: z.string().trim().min(20).max(1000).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    purpose: z.enum(["LEARNING", "NETWORKING", "COLLABORATION", "OPPORTUNITIES", "JOBS", "HACKATHONS", "GRANTS", "WEB3", "INDUSTRY", "LOCATION", "ORGANIZATION", "PROJECT", "RESEARCH", "GENERAL"]).optional(),
    visibility: z.enum(["PUBLIC", "PRIVATE", "HIDDEN"]).optional(),
    countryCode: z.string().length(2).optional().nullable(),
    language: z.string().trim().min(2).max(40).optional(),
    profileImageUrl: httpUrl.optional().nullable(),
    coverImageUrl: httpUrl.optional().nullable(),
    topics: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
    joinQuestions: z.array(z.string().trim().min(1).max(240)).max(5).optional(),
  }).strict().refine((input) => Object.keys(input).length > 0),
}), Controller.updateSpace);
router.get("/spaces/:slug/reports", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.spaceReports);
router.patch("/spaces/:slug/reports/:reportId", validate({
  params: z.object({ slug: z.string().min(1).max(64), reportId: uuid }),
  body: z.object({
    action: z.enum(["RESOLVE", "DISMISS", "LOCK_POST", "UNLOCK_POST", "REMOVE_CONTENT"]),
    note: z.string().trim().max(500).optional(),
  }),
}), Controller.moderateSpaceReport);
router.delete("/spaces/:slug", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.deleteSpace);
router.post("/spaces/:slug/transfer-ownership", validate({
  params: z.object({ slug: z.string().min(1).max(64) }),
  body: z.object({ userId: uuid }),
}), Controller.transferSpaceOwnership);
router.get("/spaces/:slug/invites", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.spaceInvites);
router.post("/spaces/:slug/invites", validate({
  params: z.object({ slug: z.string().min(1).max(64) }),
  body: z.object({
    expiresInDays: z.number().int().min(1).max(365).optional(),
    maxUses: z.number().int().min(1).max(10000).optional().nullable(),
    approvalRequired: z.boolean().optional(),
  }),
}), Controller.createSpaceInvite);
router.delete("/spaces/:slug/invites/:inviteId", validate({
  params: z.object({ slug: z.string().min(1).max(64), inviteId: uuid }),
}), Controller.revokeSpaceInvite);
router.post("/invites/:token/accept", validate({
  params: z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }),
  body: z.object({ answers: z.array(z.string().trim().max(1000)).max(5).optional() }),
}), Controller.acceptSpaceInvite);
router.get("/invites/:token", validate({
  params: z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }),
}), Controller.previewSpaceInvite);
router.get("/spaces/:slug/events", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.listSpaceEvents);
router.post("/spaces/:slug/events", validate({
  params: z.object({ slug: z.string().min(1).max(64) }),
  body: z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(1).max(3000),
    kind: z.enum(["WORKSHOP", "AMA", "HACKATHON", "STUDY_SESSION", "MEETING", "NETWORKING", "DEMO", "OTHER"]),
    startsAt: z.string().datetime({ offset: true }),
    endsAt: z.string().datetime({ offset: true }).optional().nullable(),
    timezone: z.string().trim().min(1).max(80).default("UTC"),
    location: z.string().trim().max(300).optional().nullable(),
    meetingUrl: httpUrl.optional().nullable(),
    capacity: z.number().int().min(1).max(100000).optional().nullable(),
  }).refine((event) => !event.endsAt || new Date(event.endsAt) > new Date(event.startsAt), { message: "Event end time must be after its start time" }),
}), Controller.createSpaceEvent);
router.patch("/spaces/:slug/events/:eventId", validate({
  params: z.object({ slug: z.string().min(1).max(64), eventId: uuid }),
  body: z.object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(1).max(3000).optional(),
    kind: z.enum(["WORKSHOP", "AMA", "HACKATHON", "STUDY_SESSION", "MEETING", "NETWORKING", "DEMO", "OTHER"]).optional(),
    startsAt: z.string().datetime({ offset: true }).optional(),
    endsAt: z.string().datetime({ offset: true }).optional().nullable(),
    location: z.string().trim().max(300).optional().nullable(),
    meetingUrl: httpUrl.optional().nullable(),
    capacity: z.number().int().min(1).max(100000).optional().nullable(),
    status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
  }).strict().refine((input) => Object.keys(input).length > 0),
}), Controller.updateSpaceEvent);
router.post("/spaces/:slug/events/:eventId/rsvp", validate({
  params: z.object({ slug: z.string().min(1).max(64), eventId: uuid }),
  body: z.object({ status: z.enum(["GOING", "INTERESTED"]).nullable() }),
}), Controller.rsvpSpaceEvent);
router.get("/spaces/:slug/achievements", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.listSpaceAchievements);
router.get("/spaces/:slug/projects", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.listSpaceProjects);
router.post("/spaces/:slug/projects", validate({
  params: z.object({ slug: z.string().min(1).max(64) }),
  body: z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().min(1).max(3000),
    skillsNeeded: z.array(z.string().trim().min(1).max(60)).max(20),
  }),
}), Controller.createSpaceProject);
router.patch("/spaces/:slug/projects/:projectId", validate({
  params: z.object({ slug: z.string().min(1).max(64), projectId: uuid }),
  body: z.object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().min(1).max(3000).optional(),
    skillsNeeded: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "ARCHIVED"]).optional(),
  }).strict().refine((input) => Object.keys(input).length > 0),
}), Controller.updateSpaceProject);
router.post("/spaces/:slug/projects/:projectId/join", validate({
  params: z.object({ slug: z.string().min(1).max(64), projectId: uuid }),
  body: z.object({ role: z.enum(["FOUNDER", "DEVELOPER", "DESIGNER", "RESEARCHER", "MARKETING", "COMMUNITY", "CONTRIBUTOR"]) }),
}), Controller.joinSpaceProject);
router.delete("/spaces/:slug/projects/:projectId/join", validate({
  params: z.object({ slug: z.string().min(1).max(64), projectId: uuid }),
}), Controller.leaveSpaceProject);
router.get("/spaces/:slug/members", validate({
  params: z.object({ slug: z.string().min(1).max(64) }),
  query: z.object({
    q: z.string().trim().max(100).optional(),
    status: z.enum(["ACTIVE", "PENDING", "MUTED", "SUSPENDED", "BANNED"]).optional(),
    type: z.enum(["DEVELOPERS", "FOUNDERS", "STUDENTS", "RESEARCHERS", "ORGANIZATIONS", "CONTRIBUTORS"]).optional(),
  }),
}), Controller.spaceMembers);
router.patch("/spaces/:slug/members/:userId", validate({
  params: z.object({ slug: z.string().min(1).max(64), userId: uuid }),
  body: z.object({ action: z.enum(["APPROVE", "REJECT", "MUTE", "UNMUTE", "SUSPEND", "UNSUSPEND", "BAN", "UNBAN", "PROMOTE_MODERATOR", "DEMOTE_MODERATOR", "PROMOTE_ADMIN", "DEMOTE_ADMIN", "PROMOTE_CONTRIBUTOR", "DEMOTE_CONTRIBUTOR"]) }),
}), Controller.moderateSpaceMember);
router.post("/spaces/:slug/join", validate({
  params: z.object({ slug: z.string().min(1).max(64) }),
  body: z.object({ answers: z.array(z.string().trim().max(1000)).max(5).optional() }),
}), Controller.joinSpace);
router.delete("/spaces/:slug/join", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.leaveSpace);
router.get("/connection-requests", Controller.connectionRequests);
router.get("/connections/list", Controller.acceptedConnections);
router.post("/connections/:userId", validate({ params: z.object({ userId: uuid }) }), Controller.requestConnection);
router.patch("/connection-requests/:id", validate({
  params: z.object({ id: uuid }),
  body: z.object({ status: z.enum(["ACCEPTED", "DECLINED"]) }),
}), Controller.respondToConnection);
router.get("/messages", MessagingController.conversations);
router.get("/messages/:userId", validate({ params: z.object({ userId: uuid }) }), MessagingController.conversation);
router.post("/messages/:userId", validate({
  params: z.object({ userId: uuid }),
  body: z.object({ body: z.string().trim().min(1).max(4000) }),
}), MessagingController.sendMessage);
router.patch("/messages/:userId/read", validate({ params: z.object({ userId: uuid }) }), MessagingController.markMessagesRead);
router.get("/settings", Controller.settings);
router.patch("/settings", validate({ body: z.object({
  visibility: z.enum(["PUBLIC", "FOLLOWERS", "PRIVATE"]).optional(),
  analyzable: z.boolean().optional(),
  connectionPolicy: z.enum(["ANYONE", "FOLLOWERS", "NOBODY"]).optional(),
}) }), Controller.updateSettings);
router.post("/profile-analysis", Controller.analyzeProfile);
router.get("/profile/:userId", validate({ params: z.object({ userId: uuid }) }), Controller.profile);
router.post("/posts", validate({ body: z.object({
  content: z.string().trim().min(1).max(5000),
  kind: z.string().optional(),
  opportunityId: uuid.optional(),
  communitySlug: z.string().trim().min(1).max(64).optional(),
}) }), Controller.createPost);
router.post("/posts/:id/reaction", validate({ params: z.object({ id: uuid }) }), Controller.react);
router.get("/posts/:id/comments", validate({ params: z.object({ id: uuid }) }), Controller.comments);
router.post("/posts/:id/comments", validate({
  params: z.object({ id: uuid }),
  body: z.object({ content: z.string().trim().min(1).max(2000) }),
}), Controller.comment);
router.post("/follows/:userId", validate({ params: z.object({ userId: uuid }) }), Controller.follow);
router.post("/follows", validate({ body: z.object({
  targetType: z.enum(["ORGANIZATION", "INDUSTRY", "TOPIC", "OPPORTUNITY", "COUNTRY"]),
  targetKey: z.string().trim().min(1).max(160),
}) }), Controller.followTarget);
router.post("/reports", validate({ body: z.object({
  reason: z.string().trim().min(1).max(80),
  details: z.string().max(1000).optional(),
  postId: uuid.optional(),
  commentId: uuid.optional(),
  reportedUserId: uuid.optional(),
}) }), Controller.report);
router.post("/users/:userId/actions", validate({
  params: z.object({ userId: uuid }),
  body: z.object({ kind: z.enum(["BLOCK", "MUTE"]) }),
}), Controller.userAction);

export default router;
