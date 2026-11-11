import { describe, expect, it } from "vitest";
import { createStars, parallaxOffset, pointerInfluence, stepSpring, rippleInfluence, gravityInfluence, infallPoint } from "./starfield";

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
  it("pulls stars toward the pointer with a swirl, never past it", () => {
    expect(gravityInfluence(300, 0, 0, 0)).toEqual({ pull: { x: 0, y: 0 }, glow: 0 });
    const centre = gravityInfluence(0, 0, 0, 0);
    expect(centre.glow).toBe(1);
    expect(Number.isFinite(centre.pull.x + centre.pull.y)).toBe(true);
    const near = gravityInfluence(80, 0, 0, 0);
    expect(near.pull.x).toBeLessThan(0);
    expect(Math.abs(near.pull.x)).toBeLessThan(80);
    expect(near.pull.y).not.toBe(0);
    const close = gravityInfluence(5, 0, 0, 0);
    expect(Math.abs(close.pull.x)).toBeLessThanOrEqual(5 * .6 + 1e-9);
  });
  it("spirals an infalling star from its start into the centre", () => {
    const start = { x: 300, y: 100 }, centre = { x: 100, y: 100 };
    expect(infallPoint(start, centre, 0).x).toBeCloseTo(300);
    expect(infallPoint(start, centre, 0).y).toBeCloseTo(100);
    const end = infallPoint(start, centre, 1);
    expect(end.x).toBeCloseTo(100); expect(end.y).toBeCloseTo(100);
    const radii = [0, .25, .5, .75, 1].map(t => { const p = infallPoint(start, centre, t); return Math.hypot(p.x - 100, p.y - 100); });
    for (let i = 1; i < radii.length; i++) expect(radii[i]).toBeLessThan(radii[i - 1]);
    expect(infallPoint(start, centre, 2)).toEqual(end);
  });
});
