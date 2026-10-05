import { Router } from "express";
import * as Controller from "../../controllers/bounty.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  bountyIdParamSchema,
  bountySlugParamSchema,
  createBountySchema,
  participationSchema,
  reviewSubmissionSchema,
  submissionSchema,
} from "../../validators/bounty.validator";

const router = Router();
const zodSubmissionParams = bountyIdParamSchema.extend({
  submissionId: bountyIdParamSchema.shape.bountyId,
});

router.get("/", Controller.list);
router.get("/managed", authMiddleware, Controller.managed);
router.get("/by-opportunity/:slug", validate({ params: bountySlugParamSchema }), Controller.byOpportunitySlug);
router.post("/", authMiddleware, validate({ body: createBountySchema }), Controller.create);
router.get(
  "/:bountyId/me",
  authMiddleware,
  validate({ params: bountyIdParamSchema }),
  Controller.mySubmission,
);
router.get(
  "/:bountyId/submissions",
  authMiddleware,
  validate({ params: bountyIdParamSchema }),
  Controller.submissions,
);
router.post(
  "/:bountyId/participate",
  authMiddleware,
  validate({ params: bountyIdParamSchema, body: participationSchema }),
  Controller.recordParticipation,
);
router.post(
  "/:bountyId/submission",
  authMiddleware,
  validate({ params: bountyIdParamSchema, body: submissionSchema }),
  Controller.submitWork,
);
router.post(
  "/:bountyId/submissions/:submissionId/review",
  authMiddleware,
  validate({ params: zodSubmissionParams, body: reviewSubmissionSchema }),
  Controller.reviewSubmission,
);
router.get(
  "/:bountyId",
  validate({ params: bountyIdParamSchema }),
  Controller.get,
);

export default router;
