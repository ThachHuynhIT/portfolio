import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/cloudinary", () => ({ cloudinary: {} }));

import { isDestroyConfirmed } from "@/lib/media-service";

describe("isDestroyConfirmed", () => {
  it("accepts ok and already-missing files", () => {
    expect(isDestroyConfirmed({ result: "ok" })).toBe(true);
    expect(isDestroyConfirmed({ result: "not found" })).toBe(true);
  });

  it("rejects any other answer", () => {
    expect(isDestroyConfirmed({ result: "error" })).toBe(false);
    expect(isDestroyConfirmed({})).toBe(false);
    expect(isDestroyConfirmed(null)).toBe(false);
  });
});
