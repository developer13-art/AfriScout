import { Router } from "express";
import * as Controller from "../../controllers/webhook.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";
import {
  webhookEndpointCreateSchema,
  webhookEndpointUpdateSchema,
} from "../../validators/webhook.validator";

const router = Router();

router.use(authMiddleware);

router.get("/endpoints", Controller.listEndpoints);
router.post("/endpoints", validate({ body: webhookEndpointCreateSchema }), Controller.createEndpoint);
router.patch("/endpoints/:id", validate({ body: webhookEndpointUpdateSchema }), Controller.updateEndpoint);
router.delete("/endpoints/:id", Controller.deleteEndpoint);
router.get("/deliveries", Controller.listDeliveries);
router.post("/deliveries/:id/retry", Controller.retry);

export default router;