import type { ChartSeries } from './chart.types';

export interface StackBand {
  seriesIndex: number;
  name: string;
  stackId: string;
  color?: ChartSeries['color'];
  values: number[];
  lower: number[];
  upper: number[];
}

export function stackSeries(series: ChartSeries[]): {
  bands: StackBand[];
  extent: { min: number; max: number };
} {
  if (series.length === 0) return { bands: [], extent: { min: 0, max: 0 } };
  const n = Math.max(0, ...series.map((s) => s.data.length));
  const pos: Record<string, number[]> = {};
  const neg: Record<string, number[]> = {};
  const bands: StackBand[] = [];

  for (let si = 0; si < series.length; si++) {
    const s = series[si]!;
    const stackId = s.stackId ?? '__default';
    if (!pos[stackId]) pos[stackId] = Array.from({ length: n }, () => 0);
    if (!neg[stackId]) neg[stackId] = Array.from({ length: n }, () => 0);

    const values = Array.from({ length: n }, (_, i) => {
      const v = s.data[i];
      return Number.isFinite(v) ? (v as number) : 0;
    });
    const lower: number[] = [];
    const upper: number[] = [];
    for (let i = 0; i < n; i++) {
      const v = values[i]!;
      if (v >= 0) {
        const base = pos[stackId]![i]!;
        lower.push(base);
        upper.push(base + v);
        pos[stackId]![i] = base + v;
      } else {
        const base = neg[stackId]![i]!;
        upper.push(base);
        lower.push(base + v);
        neg[stackId]![i] = base + v;
      }
    }
    bands.push({
      seriesIndex: si,
      name: s.name,
      stackId,
      color: s.color,
      values,
      lower,
      upper,
    });
  }

  const all = bands.flatMap((b) => [...b.lower, ...b.upper]);
  return {
    bands,
    extent: { min: Math.min(0, ...all), max: Math.max(0, ...all) },
  };
}
