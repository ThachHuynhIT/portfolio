import { describe, expect, it } from "vitest";
import { mapHomeBlackHole } from "./home-black-hole";

describe("homepage black hole framing", () => {
  it("starts at the hero framing", () => {
    expect(mapHomeBlackHole(0, 900)).toEqual({ scale: 1, x: 0, y: 0, opacity: 1 });
  });
  it("settles and remains visible beyond the hero", () => {
    expect(mapHomeBlackHole(900, 900)).toMatchObject({ x: 6, y: 4 });
    expect(mapHomeBlackHole(900, 900).scale).toBeCloseTo(0.68);
    expect(mapHomeBlackHole(900, 900).opacity).toBeCloseTo(0.60);
    expect(mapHomeBlackHole(9000, 900)).toEqual(mapHomeBlackHole(900, 900));
  });
  it("interpolates continuously and clamps overscroll", () => {
    expect(mapHomeBlackHole(-100, 900).scale).toBe(1);
    expect(mapHomeBlackHole(450, 900).scale).toBeCloseTo(0.84);
    expect(mapHomeBlackHole(450, 900).opacity).toBeCloseTo(0.80);
    expect(mapHomeBlackHole(1, 0).scale).toBeCloseTo(0.68);
  });
  it("uses a quieter light-theme companion", () => {
    expect(mapHomeBlackHole(900, 900, true).opacity).toBeCloseTo(0.50);
  });
  it("keeps the mobile companion at the top right", () => {
    expect(mapHomeBlackHole(900, 900, false, true)).toMatchObject({ x: 12, y: -18 });
    expect(mapHomeBlackHole(900, 900, false, true).scale).toBeCloseTo(0.68);
  });
});
