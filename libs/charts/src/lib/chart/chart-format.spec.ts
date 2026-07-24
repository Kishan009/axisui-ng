import { formatChartLabel, formatChartValue, formatPercent } from './chart-format';
import type { ChartFormatContext } from './chart.types';

const ctx: ChartFormatContext = { chartType: 'line', location: 'tooltip', seriesIndex: 0, dataIndex: 1, seriesName: 'A', originalDatum: 10 };

describe('chart-format', () => {
  it('defaults to String(value) / identity label', () => {
    expect(formatChartValue(10, null, ctx)).toBe('10');
    expect(formatChartLabel('Jan', null, ctx)).toBe('Jan');
  });

  it('uses custom formatters', () => {
    expect(formatChartValue(10, (v) => `$${v}`, ctx)).toBe('$10');
    expect(formatChartLabel('Jan', (l) => l.toUpperCase(), ctx)).toBe('JAN');
  });

  it('falls back when a formatter throws', () => {
    expect(formatChartValue(10, () => { throw new Error('boom'); }, ctx)).toBe('10');
    expect(formatChartLabel('Jan', () => { throw new Error('boom'); }, ctx)).toBe('Jan');
  });

  it('formatPercent rounds to one decimal', () => {
    expect(formatPercent(0.333)).toBe('33.3%');
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(1)).toBe('100%');
  });
});
