import { Router } from "express";
import * as Controller from "../../controllers/actorRun.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.use(authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]));

router.get("/", Controller.list);
router.get("/:id", Controller.get);
router.get("/:id/raw", Controller.rawItems);
router.post("/trigger", Controller.trigger);
router.post("/:id/abort", Controller.abort);

export default router;