import { Router } from "express";
import * as Controller from "../../controllers/publicAnalytics.controller";

const router = Router();

router.get("/totals", Controller.totals);
router.get("/countries", Controller.countries);

export default router;