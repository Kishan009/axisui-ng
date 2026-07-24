import type { ChartDomain, ChartSeries } from './chart.types';
export type { ChartType, ChartSeries } from './chart.types';

/** Overall y-domain across all series; when includeZero, extend to include 0. Empty → 0/0. */
export function seriesExtent(series: ChartSeries[], includeZero: boolean): { min: number; max: number } {
  const values = series.flatMap((s) => s.data);
  if (values.length === 0) return { min: 0, max: 0 };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (includeZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  return { min, max };
}

export function resolveDomain(
  computed: { min: number; max: number },
  explicit: ChartDomain | null | undefined,
): { ok: true; min: number; max: number } | { ok: false } {
  if (!explicit) return { ok: true, min: computed.min, max: computed.max };
  const [min, max] = explicit;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return { ok: false };
  return { ok: true, min, max };
}

export function thinLabels<T extends { x: number; text: string }>(labels: T[], maxLabels: number): T[] {
  if (labels.length <= maxLabels || maxLabels < 2) return labels;
  const last = labels.length - 1;
  const step = Math.ceil(last / (maxLabels - 1));
  const out: T[] = [];
  for (let i = 0; i < last; i += step) out.push(labels[i]!);
  const final = labels[last]!;
  if (out[out.length - 1] !== final) out.push(final);
  return out;
}

function niceNum(range: number, round: boolean): number {
  const exp = Math.floor(Math.log10(range));
  const frac = range / Math.pow(10, exp);
  let nice: number;
  if (round) {
    if (frac < 1.5) nice = 1;
    else if (frac < 3) nice = 2;
    else if (frac < 7) nice = 5;
    else nice = 10;
  } else {
    if (frac <= 1) nice = 1;
    else if (frac <= 2) nice = 2;
    else if (frac <= 5) nice = 5;
    else nice = 10;
  }
  return nice * Math.pow(10, exp);
}

/** "Nice" ascending tick values spanning [min,max] with ~count steps. min===max → [min]. */
export function niceTicks(min: number, max: number, count: number): number[] {
  if (min === max) return [min];
  const range = niceNum(max - min, false);
  const step = niceNum(range / Math.max(1, count - 1), true);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step / 2; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

/** Linear mapper domain [d0,d1] → range [r0,r1]; d0===d1 → constant r0. */
export function scaleLinear(d0: number, d1: number, r0: number, r1: number): (v: number) => number {
  if (d0 === d1) return () => r0;
  return (v: number) => r0 + ((v - d0) * (r1 - r0)) / (d1 - d0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** SVG path `d` for a polyline through pixel points. '' for empty. */
export function buildLinePath(points: [number, number][]): string {
  if (points.length === 0) return '';
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${round2(x)} ${round2(y)}`).join(' ');
}

/** Closed band between upper and lower polylines (lower traversed reverse). */
export function buildBandPath(upper: [number, number][], lower: [number, number][]): string {
  if (upper.length === 0 || lower.length === 0) return '';
  const up = upper.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${round2(x)} ${round2(y)}`).join(' ');
  const lo = [...lower].reverse().map(([x, y]) => `L ${round2(x)} ${round2(y)}`).join(' ');
  return `${up} ${lo} Z`;
}

/** Closed SVG area path: along the points then down to baselineY and back, ending 'Z'. */
export function buildAreaPath(points: [number, number][], baselineY: number): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) return '';
  const line = points.map(([x, y]) => `L ${round2(x)} ${round2(y)}`).join(' ');
  return `M ${round2(first[0])} ${round2(baselineY)} ${line} L ${round2(last[0])} ${round2(baselineY)} Z`;
}

/** Data index nearest a horizontal fraction (0..1) across count points; clamps. count<=1 → 0. */
export function nearestIndex(count: number, fraction: number): number {
  if (count <= 1) return 0;
  const clamped = Math.max(0, Math.min(1, fraction));
  return Math.max(0, Math.min(count - 1, Math.round(clamped * (count - 1))));
}

/**
 * Map a single number[] series to SVG plot points within [pad, width-pad] ×
 * [height-pad, pad] (y inverted). Flat data (min===max) sits on the vertical
 * center. Empty → []. Used by ax-sparkline.
 */
export function sparkPoints(data: number[], width: number, height: number, pad = 1): [number, number][] {
  if (data.length === 0) return [];
  const { min, max } = seriesExtent([{ name: 's', data }], false);
  const x = scaleLinear(0, Math.max(1, data.length - 1), pad, width - pad);
  const y = min === max ? () => height / 2 : scaleLinear(min, max, height - pad, pad);
  return data.map((v, i) => [x(i), y(v)]);
}
