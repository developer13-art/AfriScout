import { http } from "./http";
import type { OpportunityDocument } from "../types/opportunity";

export const documentService = {
  list: (opportunityId: string) =>
    http<OpportunityDocument[]>(`/documents/by-opportunity/${opportunityId}`),
  reprocess: (documentId: string) =>
    http<OpportunityDocument>(`/documents/${documentId}/reprocess`, {
      method: "POST",
    }),
};