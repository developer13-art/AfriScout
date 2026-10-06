import { Router } from "express";
import * as Controller from "../../controllers/user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import { achievementProofParamSchema, actionAccountSchema, proofSignatureSchema } from "../../validators/bounty.validator";
import {
  updateMeSchema,
  updateProfileSchema,
  updateBusinessProfileSchema,
  updateStudentProfileSchema,
  updateProfessionalProfileSchema,
} from "../../validators/user.validator";

const router = Router();

router.use(authMiddleware);

router.get("/me", Controller.getMe);
router.get("/me/passport", Controller.getPassport);
router.post(
  "/me/achievements/:achievementId/proof-transaction",
  validate({ params: achievementProofParamSchema, body: actionAccountSchema }),
  Controller.createAchievementProofTransaction,
);
router.post(
  "/me/achievements/:achievementId/proof-confirm",
  validate({ params: achievementProofParamSchema, body: proofSignatureSchema }),
  Controller.confirmAchievementProof,
);
router.patch("/me", validate({ body: updateMeSchema }), Controller.updateMe);
router.get("/me/profile", Controller.getProfile);
router.patch("/me/profile", validate({ body: updateProfileSchema }), Controller.updateProfile);
router.get("/me/business", Controller.getBusinessProfile);
router.patch("/me/business", validate({ body: updateBusinessProfileSchema }), Controller.updateBusinessProfile);
router.get("/me/student", Controller.getStudentProfile);
router.patch("/me/student", validate({ body: updateStudentProfileSchema }), Controller.updateStudentProfile);
router.get("/me/professional", Controller.getProfessionalProfile);
router.patch("/me/professional", validate({ body: updateProfessionalProfileSchema }), Controller.updateProfessionalProfile);

export default router;