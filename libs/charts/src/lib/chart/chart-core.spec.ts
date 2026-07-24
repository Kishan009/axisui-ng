import {
  buildAreaPath, buildBandPath, buildLinePath, nearestIndex, niceTicks, resolveDomain, scaleLinear,
  seriesExtent, sparkPoints, thinLabels,
  type ChartSeries,
} from './chart-core';

const series: ChartSeries[] = [
  { name: 'A', data: [10, 20, 30] },
  { name: 'B', data: [5, 15, 25] },
];

describe('chart-core', () => {
  it('seriesExtent spans all series; includeZero clamps to 0; empty → 0/0', () => {
    expect(seriesExtent(series, false)).toEqual({ min: 5, max: 30 });
    expect(seriesExtent([{ name: 'A', data: [10, 20] }], true)).toEqual({ min: 0, max: 20 });
    expect(seriesExtent([], false)).toEqual({ min: 0, max: 0 });
  });

  it('niceTicks produces a nice inclusive range', () => {
    expect(niceTicks(0, 95, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(7, 7, 5)).toEqual([7]);
  });

  it('scaleLinear maps endpoints and midpoint; constant when domain is degenerate', () => {
    const s = scaleLinear(0, 10, 0, 100);
    expect(s(0)).toBe(0);
    expect(s(10)).toBe(100);
    expect(s(5)).toBe(50);
    expect(scaleLinear(5, 5, 0, 100)(5)).toBe(0);
  });

  it('buildLinePath / buildAreaPath produce expected d strings', () => {
    expect(buildLinePath([[0, 0], [10, 20]])).toBe('M 0 0 L 10 20');
    expect(buildLinePath([])).toBe('');
    expect(buildAreaPath([[0, 5], [10, 15]], 100)).toBe('M 0 100 L 0 5 L 10 15 L 10 100 Z');
  });

  it('buildBandPath closes upper then reverse lower', () => {
    expect(buildBandPath([[0, 10], [10, 5]], [[0, 20], [10, 15]])).toBe(
      'M 0 10 L 10 5 L 10 15 L 0 20 Z',
    );
    expect(buildBandPath([], [])).toBe('');
  });

  it('nearestIndex maps a fraction to an index and clamps', () => {
    expect(nearestIndex(5, 0)).toBe(0);
    expect(nearestIndex(5, 1)).toBe(4);
    expect(nearestIndex(5, 0.5)).toBe(2);
    expect(nearestIndex(5, 2)).toBe(4);
    expect(nearestIndex(1, 0.7)).toBe(0);
  });

  it('resolveDomain prefers explicit domain when valid', () => {
    expect(resolveDomain({ min: 1, max: 5 }, [0, 10])).toEqual({ ok: true, min: 0, max: 10 });
    expect(resolveDomain({ min: 1, max: 5 }, [5, 1]).ok).toBe(false);
    expect(resolveDomain({ min: 1, max: 5 }, null)).toEqual({ ok: true, min: 1, max: 5 });
    expect(resolveDomain({ min: 1, max: 5 }, undefined)).toEqual({ ok: true, min: 1, max: 5 });
  });

  it('thinLabels keeps first/last and steps evenly', () => {
    const labels = Array.from({ length: 10 }, (_, i) => ({ x: i, text: String(i) }));
    expect(thinLabels(labels, 5).map((l) => l.text)).toEqual(['0', '3', '6', '9']);
    expect(thinLabels(labels, 100)).toHaveLength(10);
  });
});

describe('sparkPoints', () => {
  it('maps endpoints to the horizontal bounds (pad inset)', () => {
    const pts = sparkPoints([0, 10], 100, 30, 1);
    expect(pts[0]![0]).toBeCloseTo(1);
    expect(pts[1]![0]).toBeCloseTo(99);
  });
  it('maps higher values to smaller y (SVG inverted)', () => {
    const pts = sparkPoints([0, 10], 100, 30, 1);
    expect(pts[1]![1]).toBeLessThan(pts[0]![1]);
  });
  it('places flat data on the vertical center', () => {
    expect(sparkPoints([5, 5, 5], 100, 30).every((p) => p[1] === 15)).toBe(true);
  });
  it('returns [] for empty data', () => {
    expect(sparkPoints([], 100, 30)).toEqual([]);
  });
});
