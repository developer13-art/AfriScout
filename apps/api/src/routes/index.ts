import { Router } from "express";
import v1Routes from "./v1";
import webhookRoutes from "./webhooks";
import publicRoutes from "./public";
import { openApiJson, openApiYaml } from "./openapi";

const router = Router();

router.use("/v1", v1Routes);
router.use("/webhooks", webhookRoutes);
router.use("/public", publicRoutes);
router.get("/openapi.json", openApiJson);
router.get("/openapi.yaml", openApiYaml);

export default router;