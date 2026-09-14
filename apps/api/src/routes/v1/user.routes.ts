import { Router } from "express";
import * as Controller from "../../controllers/user.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
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