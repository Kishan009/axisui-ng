/**
 * Pure fixed-height virtual-scroll windowing math. No DOM; table-tested.
 */

/** A half-open range `[start, end)` of item indices to render. */
export interface VirtualRange {
  readonly start: number;
  readonly end: number;
}

/** Total scrollable size for `count` items of `itemSize` px. */
export function totalSize(count: number, itemSize: number): number {
  return Math.max(0, count) * Math.max(0, itemSize);
}

/**
 * The slice of indices that should be rendered for the current scroll position,
 * padded by `overscan` rows on each side and clamped to `[0, count]`. Returns an
 * empty range when there is nothing to show (no items, non-positive item size,
 * or an unmeasured/zero viewport).
 */
export function computeRange(
  scrollTop: number,
  viewportSize: number,
  itemSize: number,
  count: number,
  overscan: number
): VirtualRange {
  if (count <= 0 || itemSize <= 0 || viewportSize <= 0) return { start: 0, end: 0 };
  const over = Math.max(0, overscan);
  const first = Math.floor(Math.max(0, scrollTop) / itemSize);
  const visible = Math.ceil(viewportSize / itemSize);
  const start = Math.min(count, Math.max(0, first - over));
  const end = Math.min(count, first + visible + over + 1);
  return { start, end: Math.max(start, end) };
}
