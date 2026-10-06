import { Router } from "express";
import apifyWebhookRoutes from "./apifyWebhook.routes";

const router = Router();

router.use("/apify", apifyWebhookRoutes);

export default router;