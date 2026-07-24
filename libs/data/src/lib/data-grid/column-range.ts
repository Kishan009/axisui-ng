export interface ColumnRange {
  start: number;    // first rendered center column (inclusive)
  end: number;      // one past the last rendered center column (exclusive)
  leftPad: number;  // summed px width of center columns [0, start)
  rightPad: number; // summed px width of center columns [end, n)
}

/**
 * Windows a horizontally-scrolled set of variable-width center columns.
 * `widths` are the center columns' px widths in order; `overscan` is a column count.
 * Degenerate input (no columns, or a non-positive viewport) renders every column.
 */
export function columnRange(
  scrollLeft: number,
  viewportWidth: number,
  widths: number[],
  overscan: number,
): ColumnRange {
  const n = widths.length;
  if (n === 0 || viewportWidth <= 0) return { start: 0, end: n, leftPad: 0, rightPad: 0 };

  const offsets: number[] = new Array(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    offsets[i] = acc;
    acc += widths[i] ?? 0;
  }
  const viewportEnd = scrollLeft + viewportWidth;

  let start = 0;
  while (start < n && (offsets[start] ?? 0) + (widths[start] ?? 0) <= scrollLeft) start++;
  let end = start;
  while (end < n && (offsets[end] ?? 0) < viewportEnd) end++;

  start = Math.max(0, start - overscan);
  end = Math.min(n, end + overscan);
  if (end <= start) end = Math.min(n, start + 1);

  let leftPad = 0;
  for (let i = 0; i < start; i++) leftPad += widths[i] ?? 0;
  let rightPad = 0;
  for (let i = end; i < n; i++) rightPad += widths[i] ?? 0;

  return { start, end, leftPad, rightPad };
}
