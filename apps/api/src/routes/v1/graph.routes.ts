import { Router } from "express";
import * as Controller from "../../controllers/graph.controller";

const router = Router();

router.get("/", Controller.getOpportunityGraph);

export default router;
