import { describe, expect, it } from "vitest";
import { createStars, parallaxOffset, pointerInfluence, stepSpring, rippleInfluence, gravityInfluence, infallSpiral, cometPath, implosionInfluence, cometSpawn } from "./starfield";

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
  it("flies a star into the exact centre, swirling only near the end", () => {
    const start = { x: 0, y: 300 }, centre = { x: 600, y: 300 }, radii = { rx: 200, ry: 100 };
    const norm = (p: { x: number; y: number }) => Math.hypot((p.x - centre.x) / radii.rx, (p.y - centre.y) / radii.ry);
    const first = infallSpiral(start, centre, radii, 0, 1.5 * Math.PI);
    expect(first.x).toBeCloseTo(0); expect(first.y).toBeCloseTo(300);
    const end = infallSpiral(start, centre, radii, 1, 1.5 * Math.PI);
    expect(end.x).toBeCloseTo(600); expect(end.y).toBeCloseTo(300);
    const along = [0, .25, .5, .75, .9, 1].map(t => norm(infallSpiral(start, centre, radii, t, 1.5 * Math.PI)));
    for (let i = 1; i < along.length; i++) expect(along[i]).toBeLessThan(along[i - 1]);
    // First half: nearly straight (little turning); the swirl happens close in.
    const half = infallSpiral(start, centre, radii, .5, 1.5 * Math.PI);
    const raw = Math.atan2((half.y - 300) / 100, (half.x - 600) / 200) - Math.PI;
    const turned = Math.abs(Math.atan2(Math.sin(raw), Math.cos(raw)));
    expect(turned).toBeLessThan(.3 * 1.5 * Math.PI);
    expect(infallSpiral(start, centre, radii, 2, 1.5 * Math.PI)).toEqual(end);
  });
  it("varies which way and how much comets swirl", () => {
    expect(cometPath(3)).toEqual(cometPath(3));
    const paths = Array.from({ length: 40 }, (_, seed) => cometPath(seed));
    for (const p of paths) {
      expect(Math.abs(p.turn)).toBeGreaterThanOrEqual(Math.PI - 1e-9);
      expect(Math.abs(p.turn)).toBeLessThanOrEqual(1.4 * Math.PI + 1e-9);
    }
    expect(paths.some(p => p.turn > 0)).toBe(true);
    expect(paths.some(p => p.turn < 0)).toBe(true);
  });
  it("pulls stars into a click collapse, then lets go", () => {
    expect(implosionInfluence(400, 0, 0, 0, .3)).toBe(0);
    expect(implosionInfluence(60, 0, 0, 0, .9)).toBe(0);
    expect(implosionInfluence(60, 0, 0, 0, -.1)).toBe(0);
    expect(implosionInfluence(0, 0, 0, 0, .4)).toBe(0);
    const mid = implosionInfluence(60, 0, 0, 0, .4);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThanOrEqual(60 * .7);
    expect(implosionInfluence(60, 0, 0, 0, .05)).toBeLessThan(mid);
    expect(implosionInfluence(10, 0, 0, 0, .4)).toBeLessThanOrEqual(7 + 1e-9);
  });
  it("spawns automatic comets deterministically on the left or top/bottom edge", () => {
    expect(cometSpawn(5, 1600, 900)).toEqual(cometSpawn(5, 1600, 900));
    for (let seed = 0; seed < 50; seed++) {
      const p = cometSpawn(seed, 1600, 900);
      const onEdge = p.x === 0 || p.y === 0 || p.y === 900;
      expect(onEdge).toBe(true);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(1600 * .6);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(900);
    }
  });
});
