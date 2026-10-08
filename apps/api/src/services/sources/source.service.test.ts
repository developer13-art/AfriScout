import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../config/database";
import { testSource } from "./sourceTest.service";
import { createSource } from "./source.service";

vi.mock("../../config/database", () => ({ prisma: { source: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() } } }));
vi.mock("./sourceTest.service", () => ({ testSource: vi.fn() }));

const prismaMock = vi.mocked(prisma, true);
const testSourceMock = vi.mocked(testSource);

const input = {
  name: "Example Source",
  url: "https://example.org/opportunities",
  adapter: "example",
  sourceType: "OTHER" as const,
};

describe("createSource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.source.create.mockResolvedValue({ id: "source-1" } as never);
    prismaMock.source.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "source-1" } as never);
    prismaMock.source.update.mockResolvedValue({ id: "source-1" } as never);
  });

  it("activates a source after its initial test succeeds", async () => {
    testSourceMock.mockResolvedValue({ success: true, itemsFound: 1, datasetId: "dataset-1", runId: "run-1", errorMessage: null });

    await createSource(input, null);

    expect(prismaMock.source.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ active: false }) }));
    expect(testSourceMock).toHaveBeenCalledWith("source-1");
    expect(prismaMock.source.update).toHaveBeenCalledWith({ where: { id: "source-1" }, data: { active: true } });
  });

  it("keeps a source inactive when its initial test fails", async () => {
    testSourceMock.mockResolvedValue({ success: false, itemsFound: 0, datasetId: null, runId: null, errorMessage: "No items found" });

    await createSource(input, null);

    expect(prismaMock.source.update).not.toHaveBeenCalled();
  });
});
