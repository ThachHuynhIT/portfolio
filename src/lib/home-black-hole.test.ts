import { describe, expect, it } from "vitest";
import { mapHomeBlackHole } from "./home-black-hole";

describe("homepage black hole framing", () => {
  it("starts at the hero framing", () => {
    expect(mapHomeBlackHole(0, 900)).toEqual({ scale: 1, x: 0, y: 0, opacity: 1 });
  });
  it("stays large and keeps its horizontal center beyond the hero", () => {
    expect(mapHomeBlackHole(900, 900)).toMatchObject({ x: 0, y: 4 });
    expect(mapHomeBlackHole(900, 900).scale).toBeCloseTo(0.92);
    expect(mapHomeBlackHole(900, 900).opacity).toBeCloseTo(0.70);
    expect(mapHomeBlackHole(9000, 900)).toEqual(mapHomeBlackHole(900, 900));
  });
  it("interpolates continuously and clamps overscroll", () => {
    expect(mapHomeBlackHole(-100, 900).scale).toBe(1);
    expect(mapHomeBlackHole(450, 900).scale).toBeCloseTo(0.96);
    expect(mapHomeBlackHole(450, 900).x).toBe(0);
    expect(mapHomeBlackHole(450, 900).opacity).toBeCloseTo(0.85);
    expect(mapHomeBlackHole(1, 0).scale).toBeCloseTo(0.92);
  });
  it("keeps the hole clearly visible in the light theme", () => {
    expect(mapHomeBlackHole(900, 900, true).opacity).toBeCloseTo(0.85);
  });
  it("keeps the mobile companion near the top", () => {
    expect(mapHomeBlackHole(900, 900, false, true)).toMatchObject({ x: 4, y: -18 });
    expect(mapHomeBlackHole(900, 900, false, true).scale).toBeCloseTo(0.85);
  });
});
