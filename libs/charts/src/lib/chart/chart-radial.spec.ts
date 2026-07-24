import {
  buildSlices,
  clampDonutRatio,
  hitTestAngle,
  pointerAngle,
  validateRadialSeries,
} from './chart-radial';
import type { ChartRadialSeries } from './chart.types';

const series: ChartRadialSeries = {
  kind: 'radial',
  name: 'Share',
  data: [
    { label: 'A', value: 1 },
    { label: 'B', value: 1 },
    { label: 'C', value: 2 },
  ],
};

describe('chart-radial', () => {
  it('clampDonutRatio clamps to 0.2..0.8', () => {
    expect(clampDonutRatio(0)).toBe(0.2);
    expect(clampDonutRatio(0.55)).toBe(0.55);
    expect(clampDonutRatio(1)).toBe(0.8);
  });

  it('rejects negative values; accepts zeros', () => {
    expect(validateRadialSeries({ ...series, data: [{ label: 'A', value: -1 }] }).ok).toBe(false);
    expect(validateRadialSeries({ ...series, data: [{ label: 'A', value: 0 }] }).ok).toBe(true);
  });

  it('buildSlices starts at -90deg and proceeds clockwise by proportion', () => {
    const slices = buildSlices(series, 100, 100, 80, 0);
    expect(slices).toHaveLength(3);
    expect(slices[0]!.startAngle).toBeCloseTo(-90);
    expect(slices[0]!.endAngle - slices[0]!.startAngle).toBeCloseTo(90); // 1/4 of 360
    expect(slices[2]!.fraction).toBeCloseTo(0.5);
  });

  it('hitTestAngle finds the slice under a pointer angle', () => {
    const slices = buildSlices(series, 100, 100, 80, 0);
    expect(hitTestAngle(slices, -45)?.dataIndex).toBe(0);
    expect(hitTestAngle(slices, 135)?.dataIndex).toBe(2); // middle of C (90..270)
    expect(hitTestAngle([], 0)).toBeNull();
  });

  it('pointerAngle maps pointer position to SVG degrees via atan2', () => {
    expect(pointerAngle(100, 100, 180, 100)).toBeCloseTo(0);
    expect(pointerAngle(100, 100, 100, 180)).toBeCloseTo(90);
  });

  it('buildSlices gives zero-value slices an empty path', () => {
    const withZero: ChartRadialSeries = {
      kind: 'radial',
      name: 'Share',
      data: [
        { label: 'A', value: 1 },
        { label: 'B', value: 0 },
        { label: 'C', value: 1 },
      ],
    };
    const slices = buildSlices(withZero, 100, 100, 80, 0);
    expect(slices[1]!.path).toBe('');
    expect(slices[0]!.path.length).toBeGreaterThan(0);
    expect(slices[2]!.path.length).toBeGreaterThan(0);
  });
});
