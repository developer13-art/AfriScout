import { Router } from "express";
import * as Controller from "../../controllers/radar.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", Controller.get);

export default router;