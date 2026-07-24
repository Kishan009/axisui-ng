import {
  SCATTER_HIT_RADIUS,
  keyboardOrder,
  mapScatterPoints,
  nearestScatterPoint,
  resolveScatterDomains,
  validateXYSeries,
} from './chart-scatter';
import type { ChartXYSeries } from './chart.types';

const series: ChartXYSeries[] = [
  { kind: 'xy', name: 'A', data: [{ x: 2, y: 3 }, { x: 1, y: 5 }] },
  { kind: 'xy', name: 'B', data: [{ x: 0, y: 1 }] },
];

describe('chart-scatter', () => {
  it('validateXYSeries rejects non-finite points', () => {
    expect(validateXYSeries(series)).toEqual({ ok: true });
    expect(validateXYSeries([{ kind: 'xy', name: 'A', data: [{ x: NaN, y: 1 }] }]).ok).toBe(false);
  });

  it('resolveScatterDomains uses extents or explicit domains', () => {
    expect(resolveScatterDomains(series, null, null)).toEqual({
      ok: true,
      x: { min: 0, max: 2 },
      y: { min: 1, max: 5 },
    });
    expect(resolveScatterDomains(series, [0, 10], [0, 10])).toEqual({
      ok: true,
      x: { min: 0, max: 10 },
      y: { min: 0, max: 10 },
    });
    expect(resolveScatterDomains(series, [5, 1], null).ok).toBe(false);
  });

  it('keyboardOrder sorts by series then ascending x then input index', () => {
    const order = keyboardOrder(series);
    expect(order.map((p) => [p.seriesIndex, p.dataIndex])).toEqual([
      [0, 1], // x=1
      [0, 0], // x=2
      [1, 0], // series B
    ]);
  });

  it('nearestScatterPoint respects hit radius', () => {
    const mapped = mapScatterPoints(series, (v) => v * 10, (v) => 100 - v * 10);
    const hit = nearestScatterPoint(mapped, 10, 50, SCATTER_HIT_RADIUS); // near (1,5) → (10,50)
    expect(hit?.seriesIndex).toBe(0);
    expect(hit?.dataIndex).toBe(1);
    expect(nearestScatterPoint(mapped, 200, 200, SCATTER_HIT_RADIUS)).toBeNull();
  });
});
