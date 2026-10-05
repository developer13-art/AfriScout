import { Router } from "express";
import * as Controller from "../../controllers/ai.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/opportunities/:id/summary", Controller.summary);
router.post("/opportunities/:id/analyst", Controller.analyst);
router.post("/ask", Controller.ask);

export default router;