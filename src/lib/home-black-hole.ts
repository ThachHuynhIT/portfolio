/**
 * Hero-to-companion framing; percentages are relative to the viewport.
 *
 * Past the hero the hole stays large and keeps its horizontal center: the
 * frame scales around the hole's own center (`.portfolio-bh-frame`
 * transform-origin), so on desktop only a small vertical drift remains.
 */
export function mapHomeBlackHole(scroll: number, heroHeight: number, light = false, mobile = false) {
  const progress = Math.max(0, Math.min(1, scroll / Math.max(1, heroHeight)));
  const eased = progress * progress * (3 - 2 * progress);
  return {
    scale: 1 - (mobile ? 0.15 : 0.08) * eased,
    x: (mobile ? 4 : 0) * eased,
    y: (mobile ? -18 : 4) * eased,
    opacity: 1 - (light ? 0.15 : 0.3) * eased,
  };
}
