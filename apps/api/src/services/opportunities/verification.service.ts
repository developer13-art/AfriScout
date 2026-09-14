import { prisma } from "../../config/database";
import { NotFoundError } from "../../utils/errors";

export async function markOpportunityVerified(
  opportunityId: string,
  verifiedBy: string,
  status: "UNVERIFIED" | "PARTIAL" | "VERIFIED" | "DISPUTED",
) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
    select: { id: true },
  });
  if (!opportunity) throw new NotFoundError("Opportunity not found");

  return prisma.opportunity.update({
    where: { id: opportunityId },
    data: {
      verificationStatus: status,
      verifiedAt: status === "VERIFIED" ? new Date() : null,
      verifiedBy,
      systemState: status === "VERIFIED" ? "VERIFIED" : undefined,
    },
    select: {
      id: true,
      verificationStatus: true,
      verifiedAt: true,
      verifiedBy: true,
      systemState: true,
    },
  });
}