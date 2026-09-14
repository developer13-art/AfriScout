import { Router } from "express";
import * as Controller from "../../controllers/organization.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", Controller.list);
router.get("/:id", Controller.get);
router.post("/", authMiddleware, Controller.create);
router.patch("/:id", authMiddleware, Controller.update);
router.get("/:id/members", authMiddleware, Controller.members);
router.post("/:id/members", authMiddleware, Controller.addMember);
router.delete("/:id/members/:memberId", authMiddleware, Controller.removeMember);

export default router;