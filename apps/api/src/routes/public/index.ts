import { Router } from "express";
import publicOpportunityRoutes from "./publicOpportunity.routes";
import publicSourceRoutes from "./publicSource.routes";
import publicAnalyticsRoutes from "./publicAnalytics.routes";
import publicOrganizationRoutes from "./publicOrganization.routes";

const router = Router();

router.use("/opportunities", publicOpportunityRoutes);
router.use("/sources", publicSourceRoutes);
router.use("/analytics", publicAnalyticsRoutes);
router.use("/organizations", publicOrganizationRoutes);

export default router;