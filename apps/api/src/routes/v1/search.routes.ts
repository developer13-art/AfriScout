import { Router } from "express";
import * as Controller from "../../controllers/search.controller";
import { validate } from "../../middleware/validation.middleware";
import { searchBodySchema, searchIntentBodySchema } from "../../validators/search.validator";

const router = Router();

router.post("/", validate({ body: searchBodySchema }), Controller.search);
router.post("/intent", validate({ body: searchIntentBodySchema }), Controller.intent);

export default router;