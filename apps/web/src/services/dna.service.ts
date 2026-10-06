import { http } from "./http";
import type { DnaDraft, DnaProfile } from "../types/dna";

export const dnaService = {
  getActive: () => http<DnaProfile | null>("/dna/active"),
  listVersions: () => http<DnaProfile[]>("/dna/versions"),
  create: (draft: DnaDraft) =>
    http<DnaProfile>("/dna", { method: "POST", body: JSON.stringify(draft) }),
  update: (draft: Partial<DnaDraft>) =>
    http<DnaProfile>("/dna/active", { method: "PATCH", body: JSON.stringify(draft) }),
  archive: () => http<void>("/dna/active/archive", { method: "POST" }),
};