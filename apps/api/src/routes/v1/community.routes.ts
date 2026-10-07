import { Router } from "express";
import { z } from "zod";
import * as Controller from "../../controllers/community.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";

const uuid = z.string().uuid();
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
router.post("/spaces", validate({ body: z.object({
  name: z.string().trim().min(3).max(80),
  slug: z.string().trim().min(3).max(64),
  description: z.string().trim().min(20).max(1000),
  category: z.string().trim().min(1).max(80),
  purpose: z.enum(["LEARNING", "NETWORKING", "COLLABORATION", "OPPORTUNITIES", "JOBS", "HACKATHONS", "GRANTS", "WEB3", "INDUSTRY", "LOCATION", "ORGANIZATION", "PROJECT", "RESEARCH", "GENERAL"]),
  visibility: z.enum(["PUBLIC", "PRIVATE", "HIDDEN"]),
  countryCode: z.string().length(2).optional().nullable(),
  language: z.string().trim().min(2).max(40),
  profileImageUrl: z.string().url().max(500).optional().nullable(),
  coverImageUrl: z.string().url().max(500).optional().nullable(),
  topics: z.array(z.string().trim().min(1).max(40)).max(12),
}) }), Controller.createSpace);
router.get("/spaces", Controller.spaces);
router.get("/spaces/:slug", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.space);
router.get("/spaces/:slug/members", validate({
  params: z.object({ slug: z.string().min(1).max(64) }),
  query: z.object({ q: z.string().trim().max(100).optional(), status: z.enum(["ACTIVE", "PENDING"]).optional() }),
}), Controller.spaceMembers);
router.patch("/spaces/:slug/members/:userId", validate({
  params: z.object({ slug: z.string().min(1).max(64), userId: uuid }),
  body: z.object({ action: z.enum(["APPROVE", "REJECT", "SUSPEND", "BAN", "PROMOTE_MODERATOR", "DEMOTE_MODERATOR"]) }),
}), Controller.moderateSpaceMember);
router.post("/spaces/:slug/join", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.joinSpace);
router.delete("/spaces/:slug/join", validate({ params: z.object({ slug: z.string().min(1).max(64) }) }), Controller.leaveSpace);
router.get("/connection-requests", Controller.connectionRequests);
router.get("/connections/list", Controller.acceptedConnections);
router.post("/connections/:userId", validate({ params: z.object({ userId: uuid }) }), Controller.requestConnection);
router.patch("/connection-requests/:id", validate({
  params: z.object({ id: uuid }),
  body: z.object({ status: z.enum(["ACCEPTED", "DECLINED"]) }),
}), Controller.respondToConnection);
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
