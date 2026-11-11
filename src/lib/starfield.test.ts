import { describe, expect, it } from "vitest";
import { createStars, parallaxOffset, pointerInfluence, stepSpring, rippleInfluence } from "./starfield";

describe("starfield", () => {
  it("is deterministic and clamps counts", () => {
    expect(createStars(1000, 800, 42)).toEqual(createStars(1000, 800, 42));
    expect(createStars(1000, 800, 42)).not.toEqual(createStars(1000, 800, 43));
    expect(createStars(1000, 800, 42, 0)).toHaveLength(60);
    expect(createStars(1, 1, 42)).toHaveLength(60);
    expect(createStars(10000, 10000, 42)).toHaveLength(360);
  });
  it("orders layer populations, sizes and brightness", () => {
    const layers = [0, 1, 2].map(layer => createStars(1000, 800, 42).filter(s => s.layer === layer));
    expect(layers[0].length).toBeGreaterThan(layers[1].length);
    expect(layers[1].length).toBeGreaterThan(layers[2].length);
    for (let i = 0; i < 2; i++) {
      expect(Math.max(...layers[i].map(s => s.radius))).toBeLessThan(Math.min(...layers[i + 1].map(s => s.radius)));
      expect(Math.max(...layers[i].map(s => s.baseAlpha))).toBeLessThan(Math.min(...layers[i + 1].map(s => s.baseAlpha)));
    }
  });
  it("uses opposite pointer parallax", () => {
    expect(parallaxOffset(2, 1, -1, 100)).toEqual({ dx: -26, dy: 17 });
  });
  it("bounds pointer influence and handles the centre", () => {
    expect(pointerInfluence(200, 0, 0, 0)).toEqual({ push: { x: 0, y: 0 }, glow: 0 });
    const centre = pointerInfluence(0, 0, 0, 0);
    expect(centre.glow).toBe(1);
    expect(Number.isFinite(centre.push.x + centre.push.y)).toBe(true);
    expect(pointerInfluence(75, 0, 0, 0).push.x).toBeCloseTo(26 * (1 - 75 / 180) ** 1.5);
  });
  it("converges at the maximum timestep", () => {
    let state = { value: 30, velocity: 0 };
    for (let i = 0; i < 200; i++) state = stepSpring(state.value, 0, state.velocity, .05);
    expect(Math.abs(state.value) + Math.abs(state.velocity)).toBeLessThan(.001);
  });
  it("expires expanding ripples", () => {
    expect(rippleInfluence(120, 0, 0, 0, .2)).toBeGreaterThan(0);
    expect(rippleInfluence(120, 0, 0, 0, .9)).toBe(0);
    expect(rippleInfluence(120, 0, 0, 0, 2)).toBe(0);
    expect(rippleInfluence(500, 0, 0, 0, .2)).toBe(0);
  });
});
