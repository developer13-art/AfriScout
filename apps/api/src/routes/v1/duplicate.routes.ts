import { Router } from "express";
import * as Controller from "../../controllers/duplicate.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.use(authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]));

router.get("/", Controller.list);
router.post("/:id/merge", Controller.merge);
router.post("/:id/separate", Controller.separate);
router.post("/:id/ignore", Controller.ignore);

export default router;