import { Router } from "express";
import publicOpportunityRoutes from "./publicOpportunity.routes";
import publicSourceRoutes from "./publicSource.routes";

const router = Router();

router.use("/opportunities", publicOpportunityRoutes);
router.use("/sources", publicSourceRoutes);

export default router;