import { Router } from "express";
import * as Controller from "../../controllers/matching.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", Controller.list);
router.get("/opportunity/:opportunityId", Controller.forOpportunity);
router.post("/recompute", Controller.recompute);

export default router;