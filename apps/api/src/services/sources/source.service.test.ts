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
  });

  it("runs an initial test for every new source", async () => {
    testSourceMock.mockResolvedValue({ success: true, itemsFound: 1, datasetId: "dataset-1", runId: "run-1", errorMessage: null });

    await createSource(input, null);

    expect(prismaMock.source.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ active: false }) }));
    expect(testSourceMock).toHaveBeenCalledWith("source-1");
  });

  it("propagates an initial test failure after creating the source", async () => {
    testSourceMock.mockRejectedValue(new Error("Apify is unavailable"));

    await expect(createSource(input, null)).rejects.toThrow("Apify is unavailable");

    expect(testSourceMock).toHaveBeenCalledWith("source-1");
  });
});
