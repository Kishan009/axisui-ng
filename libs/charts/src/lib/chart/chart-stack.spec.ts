import { stackSeries } from './chart-stack';
import type { ChartSeries } from './chart.types';

describe('stackSeries', () => {
  it('stacks positives upward from zero', () => {
    const series: ChartSeries[] = [
      { name: 'A', data: [1, 2] },
      { name: 'B', data: [3, 4] },
    ];
    const { bands, extent } = stackSeries(series);
    expect(bands).toHaveLength(2);
    expect(bands[0]).toMatchObject({ lower: [0, 0], upper: [1, 2], values: [1, 2] });
    expect(bands[1]).toMatchObject({ lower: [1, 2], upper: [4, 6], values: [3, 4] });
    expect(extent).toEqual({ min: 0, max: 6 });
  });

  it('stacks negatives downward from zero', () => {
    const { bands, extent } = stackSeries([
      { name: 'A', data: [-1, -2] },
      { name: 'B', data: [-3, -1] },
    ]);
    expect(bands[0]).toMatchObject({ lower: [-1, -2], upper: [0, 0] });
    expect(bands[1]).toMatchObject({ lower: [-4, -3], upper: [-1, -2] });
    expect(extent).toEqual({ min: -4, max: 0 });
  });

  it('groups by stackId and treats missing values as 0', () => {
    const { bands } = stackSeries([
      { name: 'A', stackId: 'g1', data: [1] },
      { name: 'B', stackId: 'g2', data: [10] },
      { name: 'C', stackId: 'g1', data: [2] },
    ]);
    expect(bands.map((b) => b.stackId)).toEqual(['g1', 'g2', 'g1']);
    expect(bands[0].upper).toEqual([1]);
    expect(bands[2].upper).toEqual([3]);
    expect(bands[1].upper).toEqual([10]);
  });

  it('returns empty bands for empty input', () => {
    expect(stackSeries([])).toEqual({ bands: [], extent: { min: 0, max: 0 } });
  });
});
