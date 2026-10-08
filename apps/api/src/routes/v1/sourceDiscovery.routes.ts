import { Router } from "express";
import * as Controller from "../../controllers/sourceDiscovery.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  discoveryRunParamsSchema,
  sourceCandidateParamsSchema,
  sourceCandidateReviewSchema,
  sourceDiscoveryInputSchema,
} from "../../validators/sourceDiscovery.validator";

const router = Router();

router.use(authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]));

router.get("/overview", Controller.overview);
router.get("/runs", Controller.listRuns);
router.post("/runs", validate({ body: sourceDiscoveryInputSchema }), Controller.createRun);
router.get("/runs/:id", validate({ params: discoveryRunParamsSchema }), Controller.getRun);
router.get("/candidates", Controller.listCandidates);
router.post(
  "/candidates/:id/review",
  validate({ params: sourceCandidateParamsSchema, body: sourceCandidateReviewSchema }),
  Controller.reviewCandidate,
);

export default router;
