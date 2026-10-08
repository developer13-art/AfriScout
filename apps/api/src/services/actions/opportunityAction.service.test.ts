import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createMemoTransaction, verifyMemoReceipt } = vi.hoisted(() => ({
  prismaMock: {
    opportunity: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    savedOpportunity: { upsert: vi.fn() },
  },
  createMemoTransaction: vi.fn(),
  verifyMemoReceipt: vi.fn(),
}));

vi.mock("../../config/database", () => ({ prisma: prismaMock }));
vi.mock("../solana/solanaReceipt.service", () => ({
  createMemoTransaction,
  verifyMemoReceipt,
}));

import {
  confirmSave,
  createSaveTransaction,
  getOpportunityAction,
} from "./opportunityAction.service";

const walletAddress = "11111111111111111111111111111111";
const opportunity = {
  id: "d4cf5d4a-1205-4d38-81ca-5c3ec65a82cb",
  title: "Solana developer bounty",
  slug: "solana-developer-bounty",
  status: "PUBLISHED",
  applicationUrl: null,
  bounty: { id: "4b16b2b3-57e4-45d6-9218-73a12f1648ec", status: "OPEN" },
};

describe("opportunity Solana Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.opportunity.findUnique.mockResolvedValue(opportunity);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "e91a0a85-84c3-44e8-85dc-c5e92f0d60e0",
      walletAddress,
      walletVerifiedAt: new Date("2026-10-01T00:00:00.000Z"),
    });
    createMemoTransaction.mockResolvedValue("base64-transaction");
    prismaMock.savedOpportunity.upsert.mockResolvedValue({
      id: "f2a5df80-685f-45c7-8c6d-00bbf36b1bce",
      opportunityId: opportunity.id,
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
    });
  });

  it("resolves the opportunity and bounty details used by Blink metadata", async () => {
    await expect(getOpportunityAction(opportunity.id)).resolves.toEqual(opportunity);
  });

  it("builds a wallet-bound Devnet save receipt without transferring tokens", async () => {
    await expect(createSaveTransaction(opportunity.id, walletAddress)).resolves.toMatchObject({
      transaction: "base64-transaction",
      message: expect.stringContaining("no tokens are transferred"),
    });
    expect(createMemoTransaction).toHaveBeenCalledWith(
      walletAddress,
      JSON.stringify({
        protocol: "scout-opportunity-action-v1",
        action: "opportunity.save",
        opportunityId: opportunity.id,
        walletAddress,
        network: "devnet",
      }),
    );
  });

  it("verifies the signed receipt before idempotently saving the opportunity", async () => {
    await confirmSave(opportunity.id, walletAddress, "signature");
    expect(verifyMemoReceipt).toHaveBeenCalledWith(
      "signature",
      walletAddress,
      JSON.stringify({
        protocol: "scout-opportunity-action-v1",
        action: "opportunity.save",
        opportunityId: opportunity.id,
        walletAddress,
        network: "devnet",
      }),
    );
    expect(prismaMock.savedOpportunity.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_opportunityId: {
            userId: "e91a0a85-84c3-44e8-85dc-c5e92f0d60e0",
            opportunityId: opportunity.id,
          },
        },
      }),
    );
  });

  it("rejects wallets that are not verified on the Scout account", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: "e91a0a85-84c3-44e8-85dc-c5e92f0d60e0",
      walletAddress,
      walletVerifiedAt: null,
    });
    await expect(createSaveTransaction(opportunity.id, walletAddress)).rejects.toThrow(
      "Link and verify this wallet in Scout before saving",
    );
    expect(createMemoTransaction).not.toHaveBeenCalled();
  });
});
