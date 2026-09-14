import { Router } from "express";
import * as Controller from "../../controllers/analytics.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.get("/opportunities", Controller.opportunities);
router.get("/me", authMiddleware, Controller.user);
router.get("/me/business", authMiddleware, Controller.business);
router.get("/admin", authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]), Controller.admin);

export default router;