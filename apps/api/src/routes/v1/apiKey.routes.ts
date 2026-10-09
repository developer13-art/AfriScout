import { Router } from "express";
import * as Controller from "../../controllers/apiKey.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { apiKeyCreateSchema, apiKeyIdParamSchema } from "../../validators/apiKey.validator";

const router = Router();

router.use(authMiddleware);
router.get("/", Controller.list);
router.post("/", validate({ body: apiKeyCreateSchema }), Controller.create);
router.delete("/:id", validate({ params: apiKeyIdParamSchema }), Controller.revoke);

export default router;