import { Router } from "express";
import * as Controller from "../../controllers/auditLog.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.use(authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]));
router.get("/", Controller.list);

export default router;