import { Router } from "express";
import * as Controller from "../../controllers/watchlist.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", Controller.list);
router.post("/", Controller.add);
router.patch("/:opportunityId", Controller.update);
router.delete("/:opportunityId", Controller.remove);

export default router;