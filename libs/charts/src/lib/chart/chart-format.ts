import type { ChartFormatContext, ChartLabelFormatter, ChartValueFormatter } from './chart.types';

export function formatChartValue(
  value: number,
  formatter: ChartValueFormatter | null | undefined,
  context: ChartFormatContext,
): string {
  if (!formatter) return String(value);
  try {
    return formatter(value, context);
  } catch {
    return String(value);
  }
}

export function formatChartLabel(
  label: string,
  formatter: ChartLabelFormatter | null | undefined,
  context: ChartFormatContext,
): string {
  if (!formatter) return label;
  try {
    return formatter(label, context);
  } catch {
    return label;
  }
}

/** Fraction 0..1 → percent string. */
export function formatPercent(fraction: number): string {
  if (!Number.isFinite(fraction) || fraction === 0) return '0%';
  if (fraction === 1) return '100%';
  return `${(Math.round(fraction * 1000) / 10).toFixed(1)}%`;
}
