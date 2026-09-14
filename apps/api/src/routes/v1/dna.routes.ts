import { Router } from "express";
import * as Controller from "../../controllers/dna.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { dnaCreateSchema, dnaPatchSchema } from "../../validators/dna.validator";

const router = Router();

router.use(authMiddleware);

router.get("/active", Controller.getActive);
router.get("/versions", Controller.listVersions);
router.post("/", validate({ body: dnaCreateSchema }), Controller.create);
router.patch("/active", validate({ body: dnaPatchSchema }), Controller.update);
router.post("/active/archive", Controller.archive);

export default router;