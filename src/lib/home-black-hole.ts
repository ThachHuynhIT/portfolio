/**
 * Hero-to-companion framing; percentages are relative to the viewport.
 *
 * Past the hero the hole stays large and slides left so it spans roughly
 * 70% of the page width behind the sections instead of shrinking into the
 * right edge (scale applies around the container's right edge).
 */
export function mapHomeBlackHole(scroll: number, heroHeight: number, light = false, mobile = false) {
  const progress = Math.max(0, Math.min(1, scroll / Math.max(1, heroHeight)));
  const eased = progress * progress * (3 - 2 * progress);
  return {
    scale: 1 - (mobile ? 0.15 : 0.08) * eased,
    x: (mobile ? 4 : -20) * eased + 0, // + 0 turns -0 into 0
    y: (mobile ? -18 : 4) * eased,
    opacity: 1 - (light ? 0.15 : 0.3) * eased,
  };
}
