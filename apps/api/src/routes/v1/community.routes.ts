import { Router } from "express";
import { z } from "zod";
import * as Controller from "../../controllers/community.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";

const uuid = z.string().uuid();
const router = Router();
router.use(authMiddleware);
router.get("/feed", Controller.feed);
router.get("/connections", Controller.connections);
router.post("/posts", validate({ body: z.object({
  content: z.string().trim().min(1).max(5000),
  kind: z.string().optional(),
  opportunityId: uuid.optional(),
}) }), Controller.createPost);
router.post("/posts/:id/reaction", validate({ params: z.object({ id: uuid }) }), Controller.react);
router.get("/posts/:id/comments", validate({ params: z.object({ id: uuid }) }), Controller.comments);
router.post("/posts/:id/comments", validate({
  params: z.object({ id: uuid }),
  body: z.object({ content: z.string().trim().min(1).max(2000) }),
}), Controller.comment);
router.post("/follows/:userId", validate({ params: z.object({ userId: uuid }) }), Controller.follow);
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
