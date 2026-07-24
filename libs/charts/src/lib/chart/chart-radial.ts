import type { ChartRadialDatum, ChartRadialSeries } from './chart.types';

const DEG = Math.PI / 180;
const r2 = (n: number): number => Math.round(n * 100) / 100;

export function clampDonutRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0.55;
  return Math.min(0.8, Math.max(0.2, ratio));
}

export function validateRadialSeries(
  series: ChartRadialSeries,
): { ok: true } | { ok: false; reason: string } {
  for (const d of series.data) {
    if (!Number.isFinite(d.value) || d.value < 0) return { ok: false, reason: 'bad-value' };
  }
  return { ok: true };
}

export interface RadialSlice {
  dataIndex: number;
  label: string;
  value: number;
  fraction: number;
  color?: ChartRadialDatum['color'];
  startAngle: number;
  endAngle: number;
  path: string;
  originalDatum: ChartRadialDatum;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = deg * DEG;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function annularPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
): string {
  if (end - start <= 0 || outer <= 0) return '';
  const [x0, y0] = polar(cx, cy, outer, start);
  const [x1, y1] = polar(cx, cy, outer, end);
  const large = end - start > 180 ? 1 : 0;
  if (inner <= 0) {
    return `M ${r2(cx)} ${r2(cy)} L ${r2(x0)} ${r2(y0)} A ${r2(outer)} ${r2(outer)} 0 ${large} 1 ${r2(x1)} ${r2(y1)} Z`;
  }
  const [ix0, iy0] = polar(cx, cy, inner, end);
  const [ix1, iy1] = polar(cx, cy, inner, start);
  return [
    `M ${r2(x0)} ${r2(y0)}`,
    `A ${r2(outer)} ${r2(outer)} 0 ${large} 1 ${r2(x1)} ${r2(y1)}`,
    `L ${r2(ix0)} ${r2(iy0)}`,
    `A ${r2(inner)} ${r2(inner)} 0 ${large} 0 ${r2(ix1)} ${r2(iy1)}`,
    'Z',
  ].join(' ');
}

export function buildSlices(
  series: ChartRadialSeries,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): RadialSlice[] {
  const total = series.data.reduce((a, d) => a + d.value, 0);
  if (total <= 0) return [];
  let angle = -90;
  return series.data.map((d, dataIndex) => {
    const fraction = d.value / total;
    const sweep = fraction * 360;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;
    return {
      dataIndex,
      label: d.label,
      value: d.value,
      fraction,
      color: d.color,
      startAngle,
      endAngle,
      path: d.value === 0 ? '' : annularPath(cx, cy, outerR, innerR, startAngle, endAngle),
      originalDatum: d,
    };
  });
}

export function hitTestAngle(slices: RadialSlice[], deg: number): RadialSlice | null {
  let a = deg;
  while (a < -90) a += 360;
  while (a >= 270) a -= 360;
  return slices.find((s) => a >= s.startAngle && a < s.endAngle) ?? null;
}

/** Pointer (px,py) → angle degrees (SVG, 0 = east, clockwise positive via atan2). */
export function pointerAngle(cx: number, cy: number, px: number, py: number): number {
  return (Math.atan2(py - cy, px - cx) * 180) / Math.PI;
}
