import { Router } from "express";
import * as Controller from "../../controllers/publicOrganization.controller";
import { validate } from "../../middleware/validation.middleware";
import { opportunitySlugParamSchema } from "../../validators/opportunity.validator";

const router = Router();

router.get("/:slug", validate({ params: opportunitySlugParamSchema }), Controller.getProfile);

export default router;
