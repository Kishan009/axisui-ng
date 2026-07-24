import type { ChartDomain, ChartXYSeries } from './chart.types';

export const SCATTER_HIT_RADIUS = 16;

export interface ScatterPointRef {
  seriesIndex: number;
  dataIndex: number;
  seriesName: string;
  x: number;
  y: number;
  label: string;
  px: number;
  py: number;
  originalDatum: ChartXYSeries['data'][number];
}

export function validateXYSeries(series: ChartXYSeries[]): { ok: true } | { ok: false; reason: string } {
  for (const s of series) {
    for (const p of s.data) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        return { ok: false, reason: 'non-finite' };
      }
    }
  }
  return { ok: true };
}

function domainOk(d: ChartDomain | null): d is ChartDomain {
  return !!d && Number.isFinite(d[0]) && Number.isFinite(d[1]) && d[0] < d[1];
}

export function resolveScatterDomains(
  series: ChartXYSeries[],
  xDomain: ChartDomain | null,
  yDomain: ChartDomain | null,
): { ok: true; x: { min: number; max: number }; y: { min: number; max: number } } | { ok: false; reason: string } {
  if (xDomain && !domainOk(xDomain)) return { ok: false, reason: 'bad-x-domain' };
  if (yDomain && !domainOk(yDomain)) return { ok: false, reason: 'bad-y-domain' };
  const xs = series.flatMap((s) => s.data.map((p) => p.x));
  const ys = series.flatMap((s) => s.data.map((p) => p.y));
  if (xs.length === 0) return { ok: true, x: { min: 0, max: 1 }, y: { min: 0, max: 1 } };
  return {
    ok: true,
    x: xDomain ? { min: xDomain[0], max: xDomain[1] } : { min: Math.min(...xs), max: Math.max(...xs) },
    y: yDomain ? { min: yDomain[0], max: yDomain[1] } : { min: Math.min(...ys), max: Math.max(...ys) },
  };
}

export function mapScatterPoints(
  series: ChartXYSeries[],
  xAt: (v: number) => number,
  yAt: (v: number) => number,
): ScatterPointRef[] {
  const out: ScatterPointRef[] = [];
  series.forEach((s, seriesIndex) => {
    s.data.forEach((p, dataIndex) => {
      out.push({
        seriesIndex,
        dataIndex,
        seriesName: s.name,
        x: p.x,
        y: p.y,
        label: p.label ?? String(p.x),
        px: xAt(p.x),
        py: yAt(p.y),
        originalDatum: p,
      });
    });
  });
  return out;
}

export function keyboardOrder(series: ChartXYSeries[]): ScatterPointRef[] {
  const mapped = mapScatterPoints(series, (v) => v, (v) => v);
  return [...mapped].sort((a, b) => {
    if (a.seriesIndex !== b.seriesIndex) return a.seriesIndex - b.seriesIndex;
    if (a.x !== b.x) return a.x - b.x;
    return a.dataIndex - b.dataIndex;
  });
}

export function nearestScatterPoint(
  points: ScatterPointRef[],
  px: number,
  py: number,
  radius: number,
): ScatterPointRef | null {
  let best: ScatterPointRef | null = null;
  let bestDist = Infinity;
  for (const p of points) {
    const d = Math.hypot(p.px - px, p.py - py);
    if (d <= radius && d < bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}
