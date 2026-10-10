import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prisma: {
    organization: { findUnique: vi.fn() },
    organizationMember: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("../../config/database", () => ({ prisma: mocks.prisma }));

import {
  getOrganizationMembership,
  joinOrganization,
} from "./organization.service";

describe("organization membership", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns an existing member's role", async () => {
    mocks.prisma.organization.findUnique.mockResolvedValue({ id: "org-1" });
    mocks.prisma.organizationMember.findUnique.mockResolvedValue({ role: "MEMBER" });

    await expect(getOrganizationMembership("org-1", "user-1")).resolves.toEqual({
      isMember: true,
      role: "MEMBER",
    });
  });

  it("adds a user as a member and preserves idempotent membership", async () => {
    mocks.prisma.organization.findUnique.mockResolvedValue({ id: "org-1" });
    mocks.prisma.organizationMember.upsert.mockResolvedValue({
      id: "member-1",
      organizationId: "org-1",
      userId: "user-1",
      role: "MEMBER",
      createdAt: new Date("2026-10-10T00:00:00.000Z"),
    });

    const result = await joinOrganization("org-1", "user-1");

    expect(mocks.prisma.organizationMember.upsert).toHaveBeenCalledWith({
      where: { organizationId_userId: { organizationId: "org-1", userId: "user-1" } },
      update: {},
      create: { organizationId: "org-1", userId: "user-1", role: "MEMBER" },
    });
    expect(result).toMatchObject({ isMember: true, role: "MEMBER", userId: "user-1" });
  });
});
