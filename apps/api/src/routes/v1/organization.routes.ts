import { Router } from "express";
import * as Controller from "../../controllers/organization.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { z } from "zod";
import { organizationOpportunityCreateSchema } from "../../validators/opportunity.validator";

const router = Router();

router.get("/", Controller.list);
router.get("/mine", authMiddleware, Controller.mine);
router.get("/:id/membership", authMiddleware, validate({ params: z.object({ id: z.string().uuid() }) }), Controller.membership);
router.post("/:id/join", authMiddleware, validate({ params: z.object({ id: z.string().uuid() }) }), Controller.join);
router.post(
  "/:id/opportunities",
  authMiddleware,
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: organizationOpportunityCreateSchema,
  }),
  Controller.createOpportunity,
);
router.get("/:id", Controller.get);
router.post("/", authMiddleware, Controller.create);
router.patch("/:id", authMiddleware, Controller.update);
router.get("/:id/members", authMiddleware, Controller.members);
router.post(
  "/:id/members",
  authMiddleware,
  validate({
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      userId: z.string().trim().min(3).max(320),
      role: z.enum(["MEMBER", "ADMIN", "OWNER"]),
    }),
  }),
  Controller.addMember,
);
router.delete("/:id/members/:memberId", authMiddleware, Controller.removeMember);

export default router;