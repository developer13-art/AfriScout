import { Router } from "express";
import * as Controller from "../../controllers/document.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.get("/by-opportunity/:opportunityId", Controller.listByOpportunity);
router.post(
  "/:id/reprocess",
  authMiddleware,
  requireRole(["SUPER_ADMIN", "DATA_ADMIN"]),
  Controller.reprocess,
);

export default router;