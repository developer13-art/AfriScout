import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: {
    opportunity: { create: vi.fn() },
    opportunityVersion: { create: vi.fn() },
  },
  prisma: {
    organizationMember: { findUnique: vi.fn() },
    organization: { findUnique: vi.fn() },
    opportunity: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  enqueueMatchUsers: vi.fn(),
}));

vi.mock("../../config/database", () => ({ prisma: mocks.prisma }));
vi.mock("../../jobs/definitions/matchUsers.job", () => ({
  enqueueMatchUsers: mocks.enqueueMatchUsers,
}));

import { createOrganizationOpportunity } from "./opportunity.service";

describe("organization opportunity publishing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.prisma.organizationMember.findUnique.mockResolvedValue({ role: "OWNER" });
    mocks.prisma.organization.findUnique.mockResolvedValue({ id: "org-1", name: "Scout Org" });
    mocks.prisma.opportunity.findUnique.mockResolvedValue(null);
    mocks.transaction.opportunity.create.mockResolvedValue({
      id: "opportunity-1",
      title: "Community research grant",
      slug: "community-research-grant",
      organizationId: "org-1",
      status: "PUBLISHED",
    });
    mocks.transaction.opportunityVersion.create.mockResolvedValue({});
    mocks.prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof mocks.transaction) => Promise<unknown>) =>
        callback(mocks.transaction),
    );
  });

  it("publishes under the organization, records the first version, and queues matching", async () => {
    const opportunity = await createOrganizationOpportunity("org-1", "owner-1", {
      title: "Community research grant",
      category: "GRANTS",
      opportunityType: "GRANT",
      description: "A research grant for community organizations building public-interest tools.",
      isRemote: true,
    });

    expect(opportunity.status).toBe("PUBLISHED");
    expect(mocks.transaction.opportunity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org-1",
        organizationName: "Scout Org",
        status: "PUBLISHED",
        systemState: "PUBLISHED",
      }),
    });
    expect(mocks.transaction.opportunityVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ opportunityId: "opportunity-1", version: 1 }),
    });
    expect(mocks.enqueueMatchUsers).toHaveBeenCalledWith({ opportunityId: "opportunity-1" });
  });

  it("does not publish for a member who is not an organization manager", async () => {
    mocks.prisma.organizationMember.findUnique.mockResolvedValue({ role: "MEMBER" });

    await expect(
      createOrganizationOpportunity("org-1", "member-1", {
        title: "Community research grant",
        category: "GRANTS",
        opportunityType: "GRANT",
        description: "A research grant for community organizations building public-interest tools.",
        isRemote: true,
      }),
    ).rejects.toThrow("Only organization owners and admins can publish opportunities");
    expect(mocks.transaction.opportunity.create).not.toHaveBeenCalled();
    expect(mocks.enqueueMatchUsers).not.toHaveBeenCalled();
  });
});
