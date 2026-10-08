import express, { Router } from "express";
import { z } from "zod";
import * as Controller from "../../controllers/media.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validation.middleware";

const router = Router();

router.get("/images/:id", validate({ params: z.object({ id: z.string().uuid() }) }), Controller.getImage);
router.post(
  "/images",
  authMiddleware,
  express.raw({ type: ["image/png", "image/jpeg", "image/webp"], limit: "5mb" }),
  Controller.uploadImage,
);

export default router;
