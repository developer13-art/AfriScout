import { Router } from "express";
import * as Controller from "../../controllers/auth.controller";
import { validate } from "../../middleware/validation.middleware";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../../validators/auth.validator";
import { authMiddleware, optionalAuthMiddleware } from "../../middleware/auth.middleware";
import { rateLimit } from "../../middleware/rateLimit.middleware";
import { walletChallengeSchema, walletVerifySchema } from "../../validators/auth.validator";

const router = Router();

router.post("/register", validate({ body: registerSchema }), Controller.register);
router.post("/login", rateLimit({ keyPrefix: "auth:login" }), validate({ body: loginSchema }), Controller.login);
router.post("/refresh", validate({ body: refreshSchema }), Controller.refresh);
router.post(
  "/wallet/challenge",
  optionalAuthMiddleware,
  rateLimit({ keyPrefix: "auth:wallet-challenge" }),
  validate({ body: walletChallengeSchema }),
  Controller.walletChallenge,
);
router.post(
  "/wallet/verify",
  optionalAuthMiddleware,
  rateLimit({ keyPrefix: "auth:wallet-verify" }),
  validate({ body: walletVerifySchema }),
  Controller.walletVerify,
);
router.post("/logout", authMiddleware, Controller.logout);
router.get("/me", authMiddleware, Controller.me);

export default router;