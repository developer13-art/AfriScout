import { Router } from "express";
import { apifyWebhookSignatureMiddleware } from "../../middleware/webhookSignature.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { extractRunResource, verifyApifyWebhook } from "../../services/apify/webhook.service";
import { finalizeIngestion } from "../../services/apify/runIngestion.service";
import { prisma } from "../../config/database";
import { logger } from "../../config/logger";

const router = Router();

router.post(
  "/",
  apifyWebhookSignatureMiddleware,
  asyncHandler(async (req, res) => {
    const payload = req.body as {
      eventType?: string;
      resource?: Record<string, unknown>;
    };

    const resource = payload.resource ?? {};
    const { runId, datasetId, status } = extractRunResource({
      eventType: payload.eventType ?? "",
      eventData: {},
      resource,
      createdAt: new Date().toISOString(),
    });

    if (!runId) {
      logger.warn({ payload }, "apify_webhook_missing_run_id");
      res.status(202).json({ data: { ignored: true } });
      return;
    }

    const sourceRun = await prisma.sourceRun.findFirst({
      where: { apifyRunId: runId },
      select: { id: true, sourceId: true },
    });
    if (!sourceRun) {
      res.status(202).json({ data: { ignored: true } });
      return;
    }

    if (status === "SUCCEEDED") {
      await finalizeIngestion({
        runId: sourceRun.id,
        apifyRunId: runId,
        apifyDatasetId: datasetId,
        sourceId: sourceRun.sourceId,
      });
    }

    res.status(202).json({ data: { ok: true } });
  }),
);

export default router;