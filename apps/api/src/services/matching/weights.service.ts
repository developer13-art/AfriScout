import { prisma } from "../../config/database";
import { MATCH_WEIGHTS_VERSION } from "../../constants/matchWeights";
import type { MatchWeights } from "../../types/match";

const DEFAULT_WEIGHTS: MatchWeights = {
  industry: 25,
  location: 20,
  capability: 20,
  value: 15,
  eligibility: 10,
  experience: 10,
};

export async function getWeightsForUserType(userType: string): Promise<{
  weights: MatchWeights;
  version: string;
}> {
  const record = await prisma.matchWeights.findFirst({
    where: { userType, active: true },
    orderBy: { createdAt: "desc" },
  });

  if (record && typeof record.weights === "object" && record.weights) {
    return {
      weights: record.weights as unknown as MatchWeights,
      version: record.version,
    };
  }

  return { weights: DEFAULT_WEIGHTS, version: MATCH_WEIGHTS_VERSION };
}