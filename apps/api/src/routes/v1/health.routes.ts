import { Router } from "express";
import * as Controller from "../../controllers/health.controller";

const router = Router();

router.get("/", Controller.health);
router.get("/ready", Controller.readiness);
router.get("/live", Controller.liveness);

export default router;