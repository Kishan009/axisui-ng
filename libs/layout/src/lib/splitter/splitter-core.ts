/**
 * Splitter resize math — pure, no DOM. Sizes are percentages that sum to 100;
 * each panel carries a [min, max] clamp (also percentages). Every helper is
 * deterministic and table-tested, so the component stays a thin adapter.
 */

const TOTAL = 100;

const sum = (a: ReadonlyArray<number>): number => a.reduce((s, n) => s + n, 0);
const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), hi);

/** Scale positive numbers so they sum to exactly 100. */
function rescale(a: number[]): number[] {
  const total = sum(a);
  if (total <= 0) return a.map(() => TOTAL / a.length);
  return a.map((v) => (v / total) * TOTAL);
}

/**
 * Fill undefined entries with an equal share of the leftover %, clamp each to
 * its [min, max], then normalize the whole array to sum to 100.
 */
export function normalizeSizes(
  sizes: ReadonlyArray<number | undefined>,
  count: number,
  mins: ReadonlyArray<number> = [],
  maxes: ReadonlyArray<number> = [],
): number[] {
  if (count <= 0) return [];
  const defined = sizes.slice(0, count).filter((s): s is number => typeof s === 'number');
  const missing = count - defined.length;
  const fill = missing > 0 ? Math.max(0, (TOTAL - sum(defined)) / missing) : 0;

  const raw: number[] = [];
  for (let i = 0; i < count; i++) {
    const s = sizes[i];
    raw.push(typeof s === 'number' ? s : fill);
  }
  const clamped = raw.map((v, i) => clamp(v, mins[i] ?? 0, maxes[i] ?? TOTAL));
  return rescale(clamped);
}

/**
 * Move the boundary between panel `b` and `b+1` by `deltaPct`. Positive grows
 * panel b and shrinks b+1. The achievable delta is limited by panel b's max and
 * panel b+1's min (and the reverse for a negative delta), so the pair total is
 * conserved and both panels stay within their clamps.
 */
export function resize(
  sizes: ReadonlyArray<number>,
  b: number,
  deltaPct: number,
  mins: ReadonlyArray<number>,
  maxes: ReadonlyArray<number>,
): number[] {
  const next = sizes.slice();
  if (b < 0 || b >= next.length - 1) return next;
  const a = next[b]!;
  const c = next[b + 1]!;
  const aMin = mins[b] ?? 0;
  const aMax = maxes[b] ?? TOTAL;
  const cMin = mins[b + 1] ?? 0;
  const cMax = maxes[b + 1] ?? TOTAL;

  let d = deltaPct;
  if (d > 0) d = Math.min(d, aMax - a, c - cMin);
  else d = Math.max(d, aMin - a, -(cMax - c));

  next[b] = a + d;
  next[b + 1] = c - d;
  return next;
}

/** Collapse panel `index` to `collapsedSize`, giving freed % to the next sibling (or previous if last). */
export function collapse(sizes: ReadonlyArray<number>, index: number, collapsedSize: number): number[] {
  const next = sizes.slice();
  if (index < 0 || index >= next.length) return next;
  const freed = next[index]! - collapsedSize;
  if (freed <= 0) return next;
  const sibling = index < next.length - 1 ? index + 1 : index - 1;
  if (sibling < 0) return next;
  next[index] = collapsedSize;
  next[sibling] = next[sibling]! + freed;
  return next;
}

/** Expand panel `index` to `restoreSize`, taking the needed % from the next sibling (or previous if last). */
export function expand(sizes: ReadonlyArray<number>, index: number, restoreSize: number): number[] {
  const next = sizes.slice();
  if (index < 0 || index >= next.length) return next;
  const need = restoreSize - next[index]!;
  if (need <= 0) return next;
  const sibling = index < next.length - 1 ? index + 1 : index - 1;
  if (sibling < 0) return next;
  const take = Math.min(need, next[sibling]!);
  next[index] = next[index]! + take;
  next[sibling] = next[sibling]! - take;
  return next;
}

/** Snap to collapsedSize when a drag pulls a collapsible panel below `threshold`; else the raw value. */
export function snapThreshold(size: number, collapsedSize: number, threshold: number): number {
  return size < threshold ? collapsedSize : size;
}
