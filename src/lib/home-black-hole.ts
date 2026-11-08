/** Hero-to-companion framing; percentages are relative to the viewport. */
export function mapHomeBlackHole(scroll: number, heroHeight: number, light = false, mobile = false) {
  const progress = Math.max(0, Math.min(1, scroll / Math.max(1, heroHeight)));
  const eased = progress * progress * (3 - 2 * progress);
  return {
    scale: 1 - 0.32 * eased,
    x: (mobile ? 12 : 6) * eased,
    y: (mobile ? -18 : 4) * eased,
    opacity: 1 - (light ? 0.50 : 0.40) * eased,
  };
}
