import { Router } from "express";
import * as Controller from "../../controllers/saved.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", Controller.list);
router.post("/", Controller.add);
router.delete("/:opportunityId", Controller.remove);

export default router;