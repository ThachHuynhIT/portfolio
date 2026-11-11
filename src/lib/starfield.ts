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
