import { Router } from "express";
import * as Controller from "../../controllers/admin.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import { validate } from "../../middleware/validation.middleware";
import { updateUserRoleSchema, updateUserStatusSchema } from "../../validators/user.validator";

const router = Router();

router.use(authMiddleware, requireRole(["SUPER_ADMIN", "DATA_ADMIN"]));

router.get("/users", Controller.listUsers);
router.get("/users/:id", Controller.getUser);
router.patch("/users/:id/role", validate({ body: updateUserRoleSchema }), Controller.updateUserRole);
router.patch("/users/:id/status", validate({ body: updateUserStatusSchema }), Controller.updateUserStatus);

export default router;