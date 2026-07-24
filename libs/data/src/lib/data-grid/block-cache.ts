/** Pure helpers for block-based (lazy/infinite) row loading. No DOM, no Angular. */

/** First row index of the block containing `index`. Non-positive size ⇒ a single block at 0. */
export function blockStartOf(index: number, size: number): number {
  if (size <= 0) return 0;
  const i = Math.max(0, index);
  return Math.floor(i / size) * size;
}

/** Block start indices covering the half-open row range [start, end). */
export function blocksForRange(start: number, end: number, size: number): number[] {
  if (end <= start) return [];
  if (size <= 0) return [0];
  const first = blockStartOf(start, size);
  const out: number[] = [];
  for (let b = first; b < end; b += size) out.push(b);
  return out;
}

/** Of `needed` block starts, those not already in `have`. */
export function missingBlocks(needed: number[], have: ReadonlySet<number>): number[] {
  return needed.filter((b) => !have.has(b));
}

/** Assemble rows for [start, end) from a block cache; `undefined` marks an unloaded row.
 *  Cache keys are block-start row indices (0, size, 2*size, …). */
export function windowRows<T>(
  cache: ReadonlyMap<number, T[]>,
  start: number,
  end: number,
  size: number
): (T | undefined)[] {
  const out: (T | undefined)[] = [];
  for (let i = start; i < end; i++) {
    const blockStart = blockStartOf(i, size);
    const block = cache.get(blockStart);
    out.push(block ? block[i - blockStart] : undefined);
  }
  return out;
}

/** True when an append-mode viewport is within `thresholdRows` of the loaded end. */
export function needsMore(
  scrollTop: number,
  viewportSize: number,
  itemSize: number,
  loadedCount: number,
  thresholdRows: number
): boolean {
  if (loadedCount <= 0 || itemSize <= 0 || viewportSize <= 0) return false;
  const contentEnd = loadedCount * itemSize;
  const viewBottom = scrollTop + viewportSize;
  return viewBottom >= contentEnd - thresholdRows * itemSize;
}
