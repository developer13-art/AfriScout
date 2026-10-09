import { describe, expect, it } from "vitest";
import { canTriggerIngestion } from "./runIngestion.service";

describe("canTriggerIngestion", () => {
  it("allows active sources regardless of verification state", () => {
    expect(canTriggerIngestion({ active: true, verifications: [{ status: "PENDING" }] })).toBe(true);
    expect(canTriggerIngestion({ active: true, verifications: [{ status: "FAILED" }] })).toBe(true);
  });

  it("allows inactive sources only after a successful verification", () => {
    expect(canTriggerIngestion({ active: false, verifications: [{ status: "VERIFIED" }] })).toBe(true);
    expect(canTriggerIngestion({ active: false, verifications: [{ status: "PENDING" }] })).toBe(false);
    expect(canTriggerIngestion({ active: false, verifications: [{ status: "FAILED" }] })).toBe(false);
    expect(canTriggerIngestion({ active: false, verifications: null })).toBe(false);
  });
});
