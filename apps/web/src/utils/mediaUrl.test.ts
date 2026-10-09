import { describe, expect, it } from "vitest";
import { normalizeMediaImageUrl } from "./mediaUrl";

const id = "123e4567-e89b-42d3-a456-426614174000";

describe("normalizeMediaImageUrl", () => {
  it("keeps canonical API image URLs on the configured API host", () => {
    expect(normalizeMediaImageUrl(`/api/v1/media/images/${id}`)).toBe(
      `/api/v1/media/images/${id}`,
    );
  });

  it("converts legacy media paths to the canonical image endpoint", () => {
    expect(normalizeMediaImageUrl(`https://old-api.example/media/images/${id}`)).toBe(
      `/api/v1/media/images/${id}`,
    );
  });

  it("leaves unrelated external image URLs unchanged", () => {
    expect(normalizeMediaImageUrl("https://images.example/avatar.png")).toBe(
      "https://images.example/avatar.png",
    );
  });
});
