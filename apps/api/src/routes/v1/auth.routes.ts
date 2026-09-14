import { Router } from "express";
import * as Controller from "../../controllers/auth.controller";
import { validate } from "../../middleware/validation.middleware";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../../validators/auth.validator";
import { authMiddleware } from "../../middleware/auth.middleware";
import { rateLimit } from "../../middleware/rateLimit.middleware";

const router = Router();

router.post("/register", validate({ body: registerSchema }), Controller.register);
router.post("/login", rateLimit({ keyPrefix: "auth:login" }), validate({ body: loginSchema }), Controller.login);
router.post("/refresh", validate({ body: refreshSchema }), Controller.refresh);
router.post("/logout", authMiddleware, Controller.logout);
router.get("/me", authMiddleware, Controller.me);

export default router;