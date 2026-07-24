import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { AxChartComponent } from './chart.component';
import type {
  ChartLabelFormatter,
  ChartPointEvent,
  ChartSeries,
  ChartSeriesInput,
  ChartValueFormatter,
} from './chart.types';

const CHART_TYPES = ['line', 'area', 'bar', 'scatter', 'pie', 'donut'] as const;

const lineSeries: ChartSeries[] = [
  { name: 'Revenue', data: [84200, 92100, 88500, 95400, 102300, 98800] },
  { name: 'Costs', data: [51200, 54800, 53100, 56200, 58900, 57100] },
];
const lineLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

const stackedSeries: ChartSeries[] = [
  { name: 'Organic', data: [120, 140, 135, 160, 175, 168], stackId: 'visits' },
  { name: 'Paid', data: [80, 95, 88, 110, 125, 118], stackId: 'visits' },
  { name: 'Referral', data: [45, 52, 48, 55, 62, 58], stackId: 'visits' },
];

const scatterSeries: ChartSeriesInput[] = [
  {
    kind: 'xy',
    name: 'Product A',
    data: [
      { x: 12, y: 240, label: 'Jan' },
      { x: 18, y: 310, label: 'Feb' },
      { x: 22, y: 285, label: 'Mar' },
      { x: 28, y: 360, label: 'Apr' },
      { x: 34, y: 410, label: 'May' },
    ],
  },
  {
    kind: 'xy',
    name: 'Product B',
    data: [
      { x: 10, y: 190, label: 'Jan' },
      { x: 16, y: 260, label: 'Feb' },
      { x: 24, y: 305, label: 'Mar' },
      { x: 30, y: 340, label: 'Apr' },
      { x: 38, y: 395, label: 'May' },
    ],
  },
];

const radialSeries: ChartSeriesInput[] = [
  {
    kind: 'radial',
    name: 'Traffic by channel',
    data: [
      { label: 'Organic', value: 42 },
      { label: 'Paid search', value: 28 },
      { label: 'Email', value: 18 },
      { label: 'Direct', value: 12 },
    ],
  },
];

const currencyFormat: ChartValueFormatter = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const monthLabelFormat: ChartLabelFormatter = (label) => `${label} 2026`;

function eventSummary(event: ChartPointEvent | null): string {
  if (!event) return '—';
  const extra = event.x !== undefined ? `, x=${event.x}` : '';
  return `${event.seriesName} · ${event.label}: ${event.value}${extra}`;
}

@Component({
  selector: 'chart-formatters-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AxChartComponent],
  template: `
    <div class="w-[36rem] space-y-3">
      <ax-chart
        type="line"
        [series]="series"
        [labels]="labels"
        [valueFormat]="valueFormat"
        [labelFormat]="labelFormat"
        ariaLabel="Formatted revenue chart"
        (pointHover)="onHover($event)"
        (pointClick)="onClick($event)"
      />
      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <dt>Hover</dt>
        <dd>{{ summary(hover()) }}</dd>
        <dt>Click</dt>
        <dd>{{ summary(click()) }}</dd>
      </dl>
    </div>
  `,
})
class ChartFormattersDemo {
  readonly series = lineSeries;
  readonly labels = lineLabels;
  readonly valueFormat = currencyFormat;
  readonly labelFormat = monthLabelFormat;
  readonly hover = signal<ChartPointEvent | null>(null);
  readonly click = signal<ChartPointEvent | null>(null);

  onHover(event: ChartPointEvent | null): void {
    this.hover.set(event);
  }

  onClick(event: ChartPointEvent): void {
    this.click.set(event);
  }

  summary(event: ChartPointEvent | null): string {
    return eventSummary(event);
  }
}

const meta: Meta<AxChartComponent> = {
  title: 'Charts/Chart',
  component: AxChartComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AxChartComponent] })],
  argTypes: {
    type: { control: 'select', options: [...CHART_TYPES] },
    stacked: { control: 'boolean' },
    animated: { control: 'boolean' },
    showLegend: { control: 'boolean' },
    showGrid: { control: 'boolean' },
    donutRatio: { control: { type: 'range', min: 0.2, max: 0.85, step: 0.05 } },
  },
  args: {
    showLegend: true,
    showGrid: true,
    stacked: false,
    animated: false,
  },
};
export default meta;
type Story = StoryObj<AxChartComponent>;

/** Hover the plot for a crosshair tooltip across all series. */
export const Line: Story = {
  render: () => ({
    props: { series: lineSeries, labels: lineLabels },
    template: `<div class="w-[36rem]"><ax-chart type="line" [series]="series" [labels]="labels" ariaLabel="Monthly revenue and costs" /></div>`,
  }),
};

export const Area: Story = {
  render: () => ({
    props: { series: lineSeries, labels: lineLabels },
    template: `<div class="w-[36rem]"><ax-chart type="area" [series]="series" [labels]="labels" ariaLabel="Monthly revenue and costs" /></div>`,
  }),
};

export const Bar: Story = {
  render: () => ({
    props: {
      series: [{ name: 'Visits', data: [420, 550, 380, 610, 480] }] as ChartSeries[],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    },
    template: `<div class="w-[36rem]"><ax-chart type="bar" [series]="series" [labels]="labels" ariaLabel="Weekly visits" /></div>`,
  }),
};

/** Stacked bars share category width; series with the same `stackId` accumulate. */
export const StackedBar: Story = {
  render: () => ({
    props: { series: stackedSeries, labels: lineLabels },
    template: `<div class="w-[36rem]"><ax-chart type="bar" [stacked]="true" [series]="series" [labels]="labels" ariaLabel="Stacked visits by channel" /></div>`,
  }),
};

/** Stacked area renders closed band paths between cumulative series bounds. */
export const StackedArea: Story = {
  render: () => ({
    props: { series: stackedSeries, labels: lineLabels },
    template: `<div class="w-[36rem]"><ax-chart type="area" [stacked]="true" [series]="series" [labels]="labels" ariaLabel="Stacked visits by channel" /></div>`,
  }),
};

/** Scatter expects `{ kind: 'xy', data: { x, y, label? }[] }` per series. */
export const Scatter: Story = {
  render: () => ({
    props: { series: scatterSeries },
    template: `<div class="w-[36rem]"><ax-chart type="scatter" [series]="series" ariaLabel="Product performance scatter" /></div>`,
  }),
};

/** Pie accepts a single radial series: `{ kind: 'radial', data: { label, value }[] }`. */
export const Pie: Story = {
  render: () => ({
    props: { series: radialSeries },
    template: `<div class="w-[36rem]"><ax-chart type="pie" [series]="series" ariaLabel="Traffic share" /></div>`,
  }),
};

/** Donut uses `donutRatio` (0–1) for the inner hole radius. */
export const Donut: Story = {
  render: () => ({
    props: { series: radialSeries },
    template: `<div class="w-[36rem]"><ax-chart type="donut" [donutRatio]="0.55" [series]="series" ariaLabel="Traffic share" /></div>`,
  }),
};

/** Custom value/label formatters plus `pointHover` / `pointClick` outputs. */
export const FormattersAndEvents: Story = {
  decorators: [moduleMetadata({ imports: [ChartFormattersDemo] })],
  render: () => ({
    template: `<chart-formatters-demo />`,
  }),
};

/** Entry animations respect `prefers-reduced-motion`. */
export const Animated: Story = {
  render: () => ({
    props: { series: stackedSeries, labels: lineLabels },
    template: `<div class="w-[36rem]"><ax-chart type="bar" [animated]="true" [stacked]="true" [series]="series" [labels]="labels" ariaLabel="Animated stacked visits" /></div>`,
  }),
};

/** Empty series renders an in-chart “No data” message. */
export const Empty: Story = {
  render: () => ({
    props: { series: [] as ChartSeriesInput[] },
    template: `<div class="w-[36rem]"><ax-chart type="line" [series]="series" ariaLabel="Empty chart" /></div>`,
  }),
};

/** Mismatched series kind for the selected type shows “Invalid chart data”. */
export const Invalid: Story = {
  render: () => ({
    props: { series: scatterSeries },
    template: `<div class="w-[36rem]"><ax-chart type="line" [series]="series" ariaLabel="Invalid chart" /></div>`,
  }),
};
