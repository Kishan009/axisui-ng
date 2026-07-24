export type ChartType = 'line' | 'area' | 'bar' | 'scatter' | 'pie' | 'donut';
export type ChartColor = 1 | 2 | 3 | 4 | 5;
export type ChartDomain = readonly [min: number, max: number];

export interface ChartSeries {
  name: string;
  data: number[];
  stackId?: string;
  color?: ChartColor;
}

export interface ChartXYPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ChartXYSeries {
  kind: 'xy';
  name: string;
  data: ChartXYPoint[];
  color?: ChartColor;
}

export interface ChartRadialDatum {
  label: string;
  value: number;
  color?: ChartColor;
}

export interface ChartRadialSeries {
  kind: 'radial';
  name: string;
  data: ChartRadialDatum[];
}

export type ChartSeriesInput = ChartSeries | ChartXYSeries | ChartRadialSeries;
export type ChartDatum = number | ChartXYPoint | ChartRadialDatum;

export interface ChartPointEvent {
  chartType: ChartType;
  seriesIndex: number;
  dataIndex: number;
  seriesName: string;
  label: string;
  value: number;
  x?: number;
  originalDatum: ChartDatum;
}

export interface ChartFormatContext {
  chartType: ChartType;
  location: 'axis' | 'tooltip' | 'legend' | 'live-region';
  seriesIndex?: number;
  dataIndex?: number;
  seriesName?: string;
  originalDatum?: ChartDatum;
}

export type ChartValueFormatter = (value: number, context: ChartFormatContext) => string;
export type ChartLabelFormatter = (label: string, context: ChartFormatContext) => string;

export function isNumericSeries(s: ChartSeriesInput): s is ChartSeries {
  return !('kind' in s);
}

export function isXYSeries(s: ChartSeriesInput): s is ChartXYSeries {
  return 'kind' in s && s.kind === 'xy';
}

export function isRadialSeries(s: ChartSeriesInput): s is ChartRadialSeries {
  return 'kind' in s && s.kind === 'radial';
}
