import { Router } from "express";
import * as Controller from "../../controllers/workspace.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { createWorkspaceSchema } from "../../validators/workspace.validator";

const router = Router();

router.use(authMiddleware);
router.get("/", Controller.listMine);
router.post("/", validate({ body: createWorkspaceSchema }), Controller.create);

export default router;
