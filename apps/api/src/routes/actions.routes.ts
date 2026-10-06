import { Router } from "express";
import * as Controller from "../controllers/actions.controller";
import { validate } from "../middleware/validation.middleware";
import {
  actionCallbackSchema,
  actionSubmissionQuerySchema,
  actionAccountSchema,
  bountyIdParamSchema,
} from "../validators/bounty.validator";
import { rateLimit } from "../middleware/rateLimit.middleware";

const router = Router();

router.use((req, res, next) => {
  if (
    req.path !== "/.well-known/solana/actions.json" &&
    !req.path.startsWith("/actions/v1/")
  ) {
    next();
    return;
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

router.get("/.well-known/solana/actions.json", Controller.manifest);
router.use("/actions/v1/bounties", rateLimit({ keyPrefix: "solana-actions" }));
router.get(
  "/actions/v1/bounties/:bountyId",
  validate({ params: bountyIdParamSchema }),
  Controller.getBountyAction,
);
router.post(
  "/actions/v1/bounties/:bountyId",
  validate({ params: bountyIdParamSchema, body: actionAccountSchema }),
  Controller.postBountyAction,
);
router.post(
  "/actions/v1/bounties/:bountyId/participation-confirmed",
  validate({ params: bountyIdParamSchema, body: actionCallbackSchema }),
  Controller.confirmActionParticipation,
);
router.get(
  "/actions/v1/bounties/:bountyId/proof",
  validate({ params: bountyIdParamSchema }),
  Controller.getBountyProofAction,
);
router.post(
  "/actions/v1/bounties/:bountyId/proof",
  validate({
    params: bountyIdParamSchema,
    query: actionSubmissionQuerySchema,
    body: actionAccountSchema,
  }),
  Controller.postBountyProofAction,
);
router.post(
  "/actions/v1/bounties/:bountyId/proof-confirmed",
  validate({ params: bountyIdParamSchema, body: actionCallbackSchema }),
  Controller.confirmActionProof,
);

export default router;
