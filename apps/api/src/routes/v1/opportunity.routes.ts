import { Router } from "express";
import * as Controller from "../../controllers/opportunity.controller";
import { validate } from "../../middleware/validation.middleware";
import {
  opportunityFilterSchema,
  opportunitySlugParamSchema,
  opportunityIdParamSchema,
} from "../../validators/opportunity.validator";

const router = Router();

router.get("/", validate({ query: opportunityFilterSchema }), Controller.list);
router.get("/by-id/:id", validate({ params: opportunityIdParamSchema }), Controller.getById);
router.get("/:slug", validate({ params: opportunitySlugParamSchema }), Controller.getBySlug);
router.get("/:id/requirements", validate({ params: opportunityIdParamSchema }), Controller.requirements);
router.get("/:id/documents", validate({ params: opportunityIdParamSchema }), Controller.documents);
router.get("/:id/sources", validate({ params: opportunityIdParamSchema }), Controller.sources);
router.get("/:id/changes", validate({ params: opportunityIdParamSchema }), Controller.changes);

export default router;