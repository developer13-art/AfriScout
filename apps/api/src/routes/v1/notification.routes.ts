import { Router } from "express";
import * as Controller from "../../controllers/notification.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", Controller.list);
router.get("/unread-count", Controller.unreadCount);
router.post("/:id/read", Controller.markRead);
router.post("/read-all", Controller.markAllRead);
router.get("/preferences", Controller.preferences);
router.patch("/preferences", Controller.updatePreference);

export default router;