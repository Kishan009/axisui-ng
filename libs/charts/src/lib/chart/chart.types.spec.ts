import {
  isNumericSeries,
  isRadialSeries,
  isXYSeries,
  type ChartSeries,
  type ChartXYSeries,
  type ChartRadialSeries,
} from './chart.types';

describe('chart.types guards', () => {
  it('classifies series by kind', () => {
    const numeric: ChartSeries = { name: 'A', data: [1, 2] };
    const xy: ChartXYSeries = { kind: 'xy', name: 'P', data: [{ x: 1, y: 2 }] };
    const radial: ChartRadialSeries = {
      kind: 'radial',
      name: 'Share',
      data: [{ label: 'A', value: 1 }],
    };
    expect(isNumericSeries(numeric)).toBe(true);
    expect(isXYSeries(xy)).toBe(true);
    expect(isRadialSeries(radial)).toBe(true);
    expect(isNumericSeries(xy)).toBe(false);
    expect(isXYSeries(numeric)).toBe(false);
    expect(isRadialSeries(xy)).toBe(false);
  });
});
