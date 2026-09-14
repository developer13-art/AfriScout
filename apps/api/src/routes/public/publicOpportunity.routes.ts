import { Router } from "express";
import * as Controller from "../../controllers/opportunity.controller";
import { validate } from "../../middleware/validation.middleware";
import {
  opportunityFilterSchema,
  opportunitySlugParamSchema,
} from "../../validators/opportunity.validator";

const router = Router();

router.get("/", validate({ query: opportunityFilterSchema }), Controller.list);
router.get("/:slug", validate({ params: opportunitySlugParamSchema }), Controller.getBySlug);

export default router;