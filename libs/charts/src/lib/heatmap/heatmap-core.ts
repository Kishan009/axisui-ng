/** Heatmap value→color helpers — pure, no DOM. */

export function matrixExtent(matrix: number[][]): { min: number; max: number } {
  const values = matrix.flat();
  if (values.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** 0–1 normalized; equal extent (min===max) → 0; clamps out-of-range. */
export function normalize(v: number, min: number, max: number): number {
  if (min === max) return 0;
  return Math.min(1, Math.max(0, (v - min) / (max - min)));
}

/** Bucket a 0–1 value into 1…bins (clamped). */
export function binIndex(normalized: number, bins: number): number {
  const b = Math.max(1, bins);
  const i = Math.floor(Math.min(1, Math.max(0, normalized)) * b) + 1;
  return Math.min(b, Math.max(1, i));
}
