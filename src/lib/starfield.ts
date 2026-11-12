export type StarLayer = 0 | 1 | 2;
export interface Star {
  x: number; y: number; layer: StarLayer; radius: number;
  baseAlpha: number; twinklePhase: number; twinkleSpeed: number;
}

export function createStars(width: number, height: number, seed: number, density = .00026): Star[] {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const count = Math.max(60, Math.min(360, Math.round(width * height * density)));
  return Array.from({ length: count }, (_, i) => {
    const layer: StarLayer = i < count * .6 ? 0 : i < count * .88 ? 1 : 2;
    return { x: random() * width, y: random() * height, layer,
      radius: .45 + layer * .55 + random() * .35,
      baseAlpha: .18 + layer * .2 + random() * .12,
      twinklePhase: random() * Math.PI * 2, twinkleSpeed: .3 + random() * .5 };
  });
}

export function parallaxOffset(layer: StarLayer, pointerNx: number, pointerNy: number, scrollY: number) {
  const shift = [6, 14, 26][layer];
  return { dx: -Math.max(-1, Math.min(1, pointerNx)) * shift,
    dy: -Math.max(-1, Math.min(1, pointerNy)) * shift - scrollY * [.02, .05, .09][layer] };
}

export function pointerInfluence(starX: number, starY: number, px: number, py: number, radius = 180) {
  const dx = starX - px, dy = starY - py, d = Math.hypot(dx, dy);
  const glow = radius > 0 ? Math.max(0, 1 - d / radius) ** 1.5 : 0;
  return { push: { x: d ? dx / d * 26 * glow : 0, y: d ? dy / d * 26 * glow : 0 }, glow };
}

// Exact critically damped solution stays stable even when frames are dropped.
export function stepSpring(current: number, target: number, velocity: number, dt: number) {
  const t = Math.max(0, Math.min(.05, dt)), omega = 12;
  const offset = current - target, c = velocity + omega * offset, decay = Math.exp(-omega * t);
  return { value: target + (offset + c * t) * decay, velocity: (velocity - omega * c * t) * decay };
}

export function rippleInfluence(starX: number, starY: number, rippleX: number, rippleY: number, age: number) {
  if (age < 0 || age >= .9) return 0;
  return 28 * Math.max(0, 1 - Math.abs(Math.hypot(starX - rippleX, starY - rippleY) - age * 600) / 60) ** 2 * (1 - age / .9);
}

// Homepage variant: the pointer is a small gravity well. Stars are pulled
// toward it with a sideways swirl (a mini accretion vortex) instead of being
// pushed away. The pull never carries a star past the pointer.
export function gravityInfluence(starX: number, starY: number, px: number, py: number, radius = 170) {
  const dx = px - starX, dy = py - starY, d = Math.hypot(dx, dy);
  const glow = radius > 0 ? Math.max(0, 1 - d / radius) ** 1.5 : 0;
  if (!d || !glow) return { pull: { x: 0, y: 0 }, glow };
  const strength = Math.min(24 * glow, d * .6);
  const ux = dx / d, uy = dy / d;
  return { pull: { x: (ux - uy * .55) * strength, y: (uy + ux * .55) * strength }, glow };
}

type Point = { x: number; y: number };

// Position of a star falling into the black hole's centre. Works in
// coordinates normalised by the hole's elliptical radii, so the swirl follows
// the hole's shape. The radius eases to 0 while the angle advances with
// eased^6: the path is nearly straight at first and turns `turn` radians in a
// small swirl close to the centre. t is clamped to [0, 1].
export function infallSpiral(start: Point, centre: Point, radii: { rx: number; ry: number }, t: number, turn: number) {
  const k = Math.max(0, Math.min(1, t)), eased = k * k * (3 - 2 * k);
  const nx = (start.x - centre.x) / radii.rx, ny = (start.y - centre.y) / radii.ry;
  const r = Math.hypot(nx, ny) * (1 - eased), angle = Math.atan2(ny, nx) + turn * eased ** 6;
  return { x: centre.x + Math.cos(angle) * r * radii.rx, y: centre.y + Math.sin(angle) * r * radii.ry };
}

// Per-comet variety: which way it swirls and how far (π–1.4π).
export function cometPath(seed: number) {
  let t = (Math.imul(seed + 1, 0x85ebca6b) ^ 0x27d4eb2f) >>> 0;
  const next = () => { t = Math.imul(t ^ (t >>> 15), 1 | t); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const sign = next() < .5 ? -1 : 1;
  return { turn: sign * (1 + next() * .4) * Math.PI };
}

export const COLLAPSE_LIFE = .9;

// Homepage click: a brief collapse. Stars within 180px are pulled toward the
// click (strength rises then falls over COLLAPSE_LIFE, so the spring lets them
// go again). Never pulls a star more than 70% of the way in.
export function implosionInfluence(starX: number, starY: number, cx: number, cy: number, age: number) {
  if (age < 0 || age >= COLLAPSE_LIFE) return 0;
  const d = Math.hypot(starX - cx, starY - cy);
  if (!d || d >= 180) return 0;
  return Math.min(30 * Math.sin(Math.PI * age / COLLAPSE_LIFE) * (1 - d / 180) ** 1.5, d * .7);
}

// Start point for an automatic comet: on the left edge, or on the top/bottom
// edge within the left 60% of the viewport, away from the black hole side.
export function cometSpawn(seed: number, width: number, height: number) {
  let t = (seed * 0x9e3779b1 + 0x6d2b79f5) >>> 0;
  const next = () => { t = Math.imul(t ^ (t >>> 15), 1 | t); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const edge = next(), along = next();
  if (edge < .4) return { x: 0, y: along * height };
  return { x: along * width * .6, y: edge < .7 ? 0 : height };
}
