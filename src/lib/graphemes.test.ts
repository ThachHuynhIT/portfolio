import { describe, expect, it } from "vitest";
import { splitGraphemes, typingStep } from "./graphemes";

describe("hero typing", () => {
  it("preserves Vietnamese combining marks", () => {
    for (const fallback of [false, true]) {
      expect(splitGraphemes("Tha\u0323ch", fallback)).toEqual(["T", "h", "a\u0323", "c", "h"]);
      expect(splitGraphemes("Huỳnh Nguyễn Thạch", fallback).join("")).toBe("Huỳnh Nguyễn Thạch");
    }
  });
  it("keeps emoji sequences together in both paths", () => {
    for (const fallback of [false, true]) {
      expect(splitGraphemes("👩🏽‍💻🇻🇳", fallback)).toEqual(["👩🏽‍💻", "🇻🇳"]);
    }
  });
  it("handles empty names and caps the typing duration", () => {
    expect(splitGraphemes("")).toEqual([]);
    expect(typingStep(20)).toBe(70);
    expect(typingStep(100) * 100).toBeLessThanOrEqual(1600);
    expect(Number.isFinite(typingStep(0))).toBe(true);
  });
});
