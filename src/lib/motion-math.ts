/** A finite, clamped progress value, including documents with no scroll range. */
export function mapScrollProgress(scrollY: number, maxScroll: number): number {
  if (!Number.isFinite(scrollY) || !Number.isFinite(maxScroll) || maxScroll <= 0) return 0;
  return Math.min(1, Math.max(0, scrollY / maxScroll));
}
