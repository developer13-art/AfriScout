import { http } from "./http";
import type { OpportunityGraph } from "../types/opportunityGraph";

export const graphService = {
  opportunityGraph: () => http<OpportunityGraph>("/graph", { auth: false }),
};
