import { Router } from "express";
import * as Controller from "../../controllers/source.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  sourceCreateSchema,
  sourceUpdateSchema,
  sourceFilterSchema,
  sourceSuggestionCreateSchema,
  sourceSuggestionReviewSchema,
} from "../../validators/source.validator";

const router = Router();

router.get("/", validate({ query: sourceFilterSchema }), Controller.list);
router.get("/adapters", Controller.adapters);
router.get("/health", authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]), Controller.health);
router.get("/suggestions", authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]), Controller.listSuggestions);
router.post("/suggestions", validate({ body: sourceSuggestionCreateSchema }), Controller.createSuggestion);
router.post(
  "/suggestions/:id/review",
  authMiddleware,
  requireRole(["SUPER_ADMIN", "DATA_ADMIN"]),
  validate({ body: sourceSuggestionReviewSchema }),
  Controller.reviewSuggestion,
);
router.get("/:id", Controller.get);
router.post("/", authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]), validate({ body: sourceCreateSchema }), Controller.create);
router.patch("/:id", authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]), validate({ body: sourceUpdateSchema }), Controller.update);
router.post("/:id/activate", authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]), Controller.activate);
router.post("/:id/deactivate", authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]), Controller.deactivate);
router.post("/:id/test", authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]), Controller.test);

export default router;