import { prisma } from "../../config/database";
import { DEFAULT_MATCH_WEIGHTS, MATCH_WEIGHTS_VERSION } from "../../constants/matchWeights";
import type { MatchWeights } from "../../types/match";

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

  return {
    weights: DEFAULT_MATCH_WEIGHTS as MatchWeights,
    version: MATCH_WEIGHTS_VERSION,
  };
}