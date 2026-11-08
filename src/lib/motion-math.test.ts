import { describe, expect, it } from "vitest";
import { mapScrollProgress } from "./motion-math";

describe("mapScrollProgress", () => {
  it("clamps_to_zero_one", () => {
    expect(mapScrollProgress(-20, 100)).toBe(0);
    expect(mapScrollProgress(150, 100)).toBe(1);
    expect(mapScrollProgress(Number.NaN, 100)).toBe(0);
  });
  it("zero_range_returns_zero", () => {
    expect(mapScrollProgress(20, 0)).toBe(0);
    expect(mapScrollProgress(20, -1)).toBe(0);
  });
  it("half_scroll_returns_half", () => {
    expect(mapScrollProgress(50, 100)).toBe(0.5);
  });
});
