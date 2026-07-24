import { afterNextRender, ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import {
  buildAreaPath,
  buildBandPath,
  buildLinePath,
  nearestIndex,
  niceTicks,
  resolveDomain,
  scaleLinear,
  seriesExtent,
} from './chart-core';
import { formatChartLabel, formatChartValue, formatPercent } from './chart-format';
import { buildSlices, clampDonutRatio, hitTestAngle, pointerAngle, type RadialSlice, validateRadialSeries } from './chart-radial';
import {
  keyboardOrder,
  mapScatterPoints,
  nearestScatterPoint,
  resolveScatterDomains,
  SCATTER_HIT_RADIUS,
  type ScatterPointRef,
  validateXYSeries,
} from './chart-scatter';
import { stackSeries } from './chart-stack';
import {
  isNumericSeries,
  isRadialSeries,
  isXYSeries,
  type ChartDomain,
  type ChartLabelFormatter,
  type ChartPointEvent,
  type ChartSeries,
  type ChartSeriesInput,
  type ChartType,
  type ChartValueFormatter,
} from './chart.types';

const VIEW_W = 600;
const MARGIN = { top: 8, right: 12, bottom: 24, left: 36 };
const SERIES_STROKE = ['stroke-chart-1', 'stroke-chart-2', 'stroke-chart-3', 'stroke-chart-4', 'stroke-chart-5'];
const SERIES_FILL = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5'];
const SERIES_BG = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'];
// Non-color line encoding: series 0 is solid, the rest take distinct dash patterns.
const SERIES_DASH = ['', '6 4', '2 3', '8 3 2 3', '1 4'];
let chartId = 0;

function pick(arr: readonly string[], i: number): string {
  return arr[i % arr.length] ?? '';
}

interface SeriesRender {
  name: string;
  strokeClass: string;
  fillClass: string;
  linePath: string;
  areaPath: string;
  bars: { x: number; y: number; w: number; h: number }[];
}

/**
 * Chart (Pro) — dependency-free SVG line/area/bar chart with axes, gridlines, a
 * legend, and a hover crosshair tooltip. Responsive via viewBox; themed through
 * the --color-chart-1..5 tokens.
 *
 * @example
 * <ax-chart [series]="[{ name: 'Sales', data: [3,7,5,9] }]" [labels]="['Q1','Q2','Q3','Q4']" />
 * <ax-chart type="bar" [series]="[{ name: 'Visits', data: [40,55,30] }]" />
 */
@Component({
  selector: 'ax-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  styles: [
    `
      svg[data-animated='true'] [data-chart-line],
      svg[data-animated='true'] [data-chart-area],
      svg[data-animated='true'] [data-chart-point],
      svg[data-animated='true'] [data-chart-slice] {
        animation: ax-chart-fade-in var(--duration) var(--ease-out-quart) both;
      }

      svg[data-animated='true'] [data-chart-bar] {
        transform-box: fill-box;
        transform-origin: bottom center;
        animation: ax-chart-bar-in var(--duration) var(--ease-out-quart) both;
      }

      @keyframes ax-chart-fade-in {
        from {
          opacity: 0;
          transform: scale(0.96);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes ax-chart-bar-in {
        from {
          opacity: 0;
          transform: scaleY(0);
        }
        to {
          opacity: 1;
          transform: scaleY(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        svg[data-animated='true'] [data-chart-line],
        svg[data-animated='true'] [data-chart-area],
        svg[data-animated='true'] [data-chart-bar],
        svg[data-animated='true'] [data-chart-point],
        svg[data-animated='true'] [data-chart-slice] {
          animation: none !important;
        }
      }
    `,
  ],
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + VIEW_W + ' ' + height()"
      class="h-auto w-full focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      role="img"
      tabindex="0"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-describedby]="keyboardInstructionsId"
      [attr.data-animated]="motionReady() ? 'true' : null"
      (pointermove)="onMove($event)"
      (pointerleave)="onLeave()"
      (click)="onClick()"
      (keydown)="onKeydown($event)"
      (focus)="onFocus()"
      (blur)="onBlur()"
    >
      @if (modelStatus() === 'empty') {
        <text [attr.x]="VIEW_W / 2" [attr.y]="height() / 2" text-anchor="middle" class="fill-muted-foreground" font-size="12">
          No data
        </text>
      } @else if (modelStatus() === 'invalid') {
        <text [attr.x]="VIEW_W / 2" [attr.y]="height() / 2" text-anchor="middle" class="fill-muted-foreground" font-size="12">
          Invalid chart data
        </text>
      } @else if (isCartesian()) {
        @if (showGrid()) {
          @for (t of layout().ticks; track t.value) {
            <line
              data-chart-grid
              [attr.x1]="layout().plotLeft"
              [attr.x2]="layout().plotRight"
              [attr.y1]="t.y"
              [attr.y2]="t.y"
              class="stroke-border"
              stroke-width="1"
            />
          }
        }
        @for (t of layout().ticks; track t.value) {
          <text
            [attr.x]="layout().plotLeft - 4"
            [attr.y]="t.y"
            text-anchor="end"
            dominant-baseline="middle"
            class="fill-foreground/80"
            font-size="10"
            aria-hidden="true"
          >
            {{ formatAxisValue(t.value) }}
          </text>
        }
        @for (lbl of layout().xLabels; track $index) {
          <text
            [attr.x]="lbl.x"
            [attr.y]="layout().plotBottom + 16"
            text-anchor="middle"
            class="fill-foreground/80"
            font-size="10"
            aria-hidden="true"
          >
            {{ formatAxisLabel(lbl.text) }}
          </text>
        }

        @for (s of layout().rendered; track s.name; let i = $index) {
          @if (type() === 'bar') {
            @for (b of s.bars; track $index) {
              <rect data-chart-bar [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.w" [attr.height]="b.h" [attr.class]="s.fillClass" rx="1" />
            }
          } @else {
            @if (type() === 'area') {
              <path data-chart-area [attr.d]="s.areaPath" [attr.class]="s.fillClass" stroke="none" opacity="0.15" />
            }
            <!-- Per-series dash pattern so lines are distinguishable without color. -->
            <path
              data-chart-line
              [attr.d]="s.linePath"
              [attr.class]="s.strokeClass"
              [attr.stroke-dasharray]="dashFor(i)"
              fill="none"
              stroke-width="2"
            />
          }
        }

        @if (hover(); as h) {
          <g data-chart-tooltip aria-hidden="true">
            <line [attr.x1]="h.cx" [attr.x2]="h.cx" [attr.y1]="layout().plotTop" [attr.y2]="layout().plotBottom" class="stroke-border" stroke-dasharray="3 3" />
            @for (p of h.points; track p.name) {
              <circle [attr.cx]="h.cx" [attr.cy]="p.cy" r="3" [attr.class]="p.fillClass" />
            }
            <g [attr.transform]="'translate(' + h.boxX + ',' + layout().plotTop + ')'">
              <rect [attr.width]="h.boxW" [attr.height]="h.boxH" rx="4" class="fill-background stroke-border" stroke-width="1" />
              <text x="8" y="14" font-size="10" class="fill-foreground font-medium">{{ h.label }}</text>
              @for (p of h.points; track p.name; let i = $index) {
                <text x="8" [attr.y]="28 + i * 13" font-size="10" class="fill-foreground">{{ p.name }}: {{ p.value }}</text>
              }
            </g>
          </g>
        }
      } @else if (isScatter()) {
        @if (showGrid()) {
          @for (t of scatterLayout().yTicks; track t.value) {
            <line
              data-chart-grid
              [attr.x1]="scatterLayout().plotLeft"
              [attr.x2]="scatterLayout().plotRight"
              [attr.y1]="t.y"
              [attr.y2]="t.y"
              class="stroke-border"
              stroke-width="1"
            />
          }
          @for (t of scatterLayout().xTicks; track t.value) {
            <line
              data-chart-grid
              [attr.x1]="t.x"
              [attr.x2]="t.x"
              [attr.y1]="scatterLayout().plotTop"
              [attr.y2]="scatterLayout().plotBottom"
              class="stroke-border"
              stroke-width="1"
            />
          }
        }
        @for (t of scatterLayout().yTicks; track t.value) {
          <text
            [attr.x]="scatterLayout().plotLeft - 4"
            [attr.y]="t.y"
            text-anchor="end"
            dominant-baseline="middle"
            class="fill-foreground/80"
            font-size="10"
            aria-hidden="true"
          >
            {{ formatAxisValue(t.value) }}
          </text>
        }
        @for (t of scatterLayout().xTicks; track t.value) {
          <text
            [attr.x]="t.x"
            [attr.y]="scatterLayout().plotBottom + 16"
            text-anchor="middle"
            class="fill-foreground/80"
            font-size="10"
            aria-hidden="true"
          >
            {{ formatAxisValue(t.value) }}
          </text>
        }
        @for (point of scatterLayout().points; track point.seriesIndex + ':' + point.dataIndex) {
          <circle
            data-chart-point
            [attr.cx]="point.px"
            [attr.cy]="point.py"
            r="3"
            [attr.class]="scatterFillClass(point.seriesIndex)"
          />
        }
        @if (scatterHover(); as point) {
          <g data-chart-tooltip aria-hidden="true">
            <circle [attr.cx]="point.px" [attr.cy]="point.py" r="5" fill="none" class="stroke-foreground" stroke-width="1" />
            <g [attr.transform]="'translate(' + point.boxX + ',' + point.boxY + ')'">
              <rect [attr.width]="point.boxW" height="34" rx="4" class="fill-background stroke-border" stroke-width="1" />
              <text x="8" y="14" font-size="10" class="fill-foreground font-medium">{{ point.seriesName }}</text>
              <text x="8" y="27" font-size="10" class="fill-foreground">{{ point.formattedLabel }}: {{ point.formattedValue }}</text>
            </g>
          </g>
        }
      } @else if (isRadial()) {
        @for (slice of radialLayout().slices; track slice.dataIndex) {
          <path data-chart-slice [attr.d]="slice.path" [attr.class]="radialFillClass(slice)" />
        }
        @if (radialHover(); as slice) {
          <g data-chart-tooltip aria-hidden="true">
            <g [attr.transform]="'translate(' + radialTooltipX() + ',' + radialTooltipY() + ')'">
              <rect [attr.width]="slice.boxW" height="34" rx="4" class="fill-background stroke-border" stroke-width="1" />
              <text x="8" y="14" font-size="10" class="fill-foreground font-medium">{{ slice.formattedLabel }}</text>
              <text x="8" y="27" font-size="10" class="fill-foreground">{{ slice.formattedValue }} ({{ formatPercent(slice.fraction) }})</text>
            </g>
          </g>
        }
      }
    </svg>

    <p [id]="keyboardInstructionsId" class="sr-only">
      Use the arrow keys to explore chart data, Home and End to move to the first or last value, Enter or Space to select, and Escape to clear the selection.
    </p>
    <p data-chart-live aria-live="polite" aria-atomic="true" class="sr-only">{{ liveAnnouncement() }}</p>

    <!-- Non-visual alternative: the same data as a visually-hidden table, so
         screen-reader users get the values, not just the role=img summary. -->
    @if (modelStatus() === 'ok' && isCartesian()) {
      <table class="sr-only" data-chart-table>
        <caption>{{ resolvedAriaLabel() }}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            @for (s of cartesianSeries(); track s.name) {
              <th scope="col">{{ s.name }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of dataRows(); track row.label) {
            <tr>
              <th scope="row">{{ row.label }}</th>
              @for (v of row.values; track $index) {
                <td>{{ v }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    }

    @if (showLegend() && series().length > 0) {
      <div data-chart-legend class="mt-2 flex flex-wrap gap-3 text-xs">
        @if (isRadial()) {
          @for (slice of radialLayout().slices; track slice.dataIndex) {
            <span class="inline-flex items-center gap-1">
              <span [attr.class]="'inline-block h-2 w-2 rounded-full ' + radialBgClass(slice)"></span>
              {{ slice.label }}
            </span>
          }
        } @else {
          @for (s of series(); track s.name; let i = $index) {
            <span class="inline-flex items-center gap-1">
              <span [attr.class]="'inline-block h-2 w-2 rounded-full ' + bgClass(i)"></span>
              {{ s.name }}
            </span>
          }
        }
      </div>
    }
  `,
})
export class AxChartComponent {
  /** Chart type. @default 'line' */
  readonly type = input<ChartType>('line');
  /** One or more data series. */
  readonly series = input.required<ChartSeriesInput[]>();
  /** X-axis category labels; default = point index. @default [] */
  readonly labels = input<string[]>([]);
  /** Stack compatible series. @default false */
  readonly stacked = input(false);
  /** Enable chart mark animations. @default false */
  readonly animated = input(false);
  /** Formats displayed numeric values. @default null */
  readonly valueFormat = input<ChartValueFormatter | null>(null);
  /** Formats displayed labels. @default null */
  readonly labelFormat = input<ChartLabelFormatter | null>(null);
  /** Explicit scatter x domain. @default null */
  readonly xDomain = input<ChartDomain | null>(null);
  /** Explicit y domain. @default null */
  readonly yDomain = input<ChartDomain | null>(null);
  /** Inner-radius ratio for donut charts. @default 0.55 */
  readonly donutRatio = input(0.55);
  /** SVG internal height (coordinate units). @default 240 */
  readonly height = input<number>(240);
  /** Show the legend below the plot. @default true */
  readonly showLegend = input<boolean>(true);
  /** Show horizontal gridlines. @default true */
  readonly showGrid = input<boolean>(true);
  /** Approximate y-tick count. @default 5 */
  readonly yTicks = input<number>(5);
  /** Accessible name override. When empty, a summary is generated from the series. @default '' */
  readonly ariaLabel = input<string>('');
  /** Emits a selected chart point. */
  readonly pointClick = output<ChartPointEvent>();
  /** Emits the currently hovered chart point, or null after leaving the plot. */
  readonly pointHover = output<ChartPointEvent | null>();

  readonly modelStatus = computed<'ok' | 'empty' | 'invalid'>(() => {
    const series = this.series();
    if (series.length === 0) return 'empty';

    switch (this.type()) {
      case 'line':
      case 'area':
      case 'bar': {
        if (!series.every(isNumericSeries)) return 'invalid';
        const numeric = series;
        if (numeric.every((item) => item.data.length === 0)) return 'empty';
        if (!numeric.every((item) => item.data.every(Number.isFinite))) return 'invalid';
        const extent = this.stacked() && (this.type() === 'bar' || this.type() === 'area') ? stackSeries(numeric).extent : seriesExtent(numeric, this.type() !== 'line');
        return resolveDomain(extent, this.yDomain()).ok ? 'ok' : 'invalid';
      }
      case 'scatter': {
        if (!series.every(isXYSeries)) return 'invalid';
        const xy = series;
        if (xy.every((item) => item.data.length === 0)) return 'empty';
        return validateXYSeries(xy).ok && resolveScatterDomains(xy, this.xDomain(), this.yDomain()).ok ? 'ok' : 'invalid';
      }
      case 'pie':
      case 'donut': {
        const radial = series[0];
        if (series.length !== 1 || !radial || !isRadialSeries(radial) || !validateRadialSeries(radial).ok) return 'invalid';
        return radial.data.reduce((total, datum) => total + datum.value, 0) > 0 ? 'ok' : 'empty';
      }
    }
  });

  protected readonly cartesianSeries = computed<ChartSeries[]>(() => {
    const series = this.series();
    return series.every(isNumericSeries) ? series : [];
  });

  protected readonly isCartesian = computed(() => {
    const type = this.type();
    return (type === 'line' || type === 'area' || type === 'bar') && this.modelStatus() === 'ok';
  });

  protected readonly isScatter = computed(() => this.type() === 'scatter' && this.modelStatus() === 'ok');

  /**
   * Screen-reader summary: an explicit `ariaLabel` wins; otherwise describe the
   * chart type, series names, and point count so the SVG isn't just "Chart".
   */
  protected readonly resolvedAriaLabel = computed(() => {
    const custom = this.ariaLabel();
    if (custom) return custom;
    const s = this.series();
    if (!s.length) return 'Chart, no data';
    const names = s.map((x) => x.name).join(', ');
    const points = Math.max(0, ...s.map((x) => x.data.length));
    return `${this.type()} chart, ${s.length} series (${names}), ${points} points`;
  });

  protected readonly VIEW_W = VIEW_W;
  protected readonly hoverIndex = signal<number | null>(null);
  protected readonly scatterHoverPoint = signal<ScatterPointRef | null>(null);
  protected readonly radialHoverSlice = signal<RadialSlice | null>(null);
  private readonly pointerEvent = signal<ChartPointEvent | null>(null);
  private readonly keyboardEvent = signal<ChartPointEvent | null>(null);
  protected readonly liveAnnouncement = signal('');
  protected readonly svgFocused = signal(false);
  protected readonly activeEvent = computed(() => this.pointerEvent() ?? this.keyboardEvent());
  protected readonly keyboardInstructionsId = `ax-chart-keyboard-instructions-${++chartId}`;
  protected readonly motionReady = signal(false);

  constructor() {
    afterNextRender(() => {
      if (this.animated()) this.motionReady.set(true);
    });
  }

  /** Rows for the visually-hidden data table: one per category (x index). */
  protected readonly dataRows = computed(() => {
    const s = this.cartesianSeries();
    const labels = this.labels();
    const n = Math.max(0, ...s.map((x) => x.data.length));
    return Array.from({ length: n }, (_, i) => ({
      label: labels[i] ?? String(i + 1),
      values: s.map((series) => series.data[i] ?? ''),
    }));
  });

  protected bgClass(i: number): string {
    const series = this.series()[i];
    const colorIndex = series && 'color' in series ? (series.color ?? i + 1) - 1 : i;
    return pick(SERIES_BG, colorIndex);
  }

  protected scatterFillClass(i: number): string {
    const series = this.scatterSeries()[i];
    return pick(SERIES_FILL, (series?.color ?? i + 1) - 1);
  }

  protected radialFillClass(slice: RadialSlice): string {
    return pick(SERIES_FILL, (slice.color ?? slice.dataIndex + 1) - 1);
  }

  protected radialBgClass(slice: RadialSlice): string {
    return pick(SERIES_BG, (slice.color ?? slice.dataIndex + 1) - 1);
  }

  protected formatPercent(fraction: number): string {
    return formatPercent(fraction);
  }

  protected formatAxisValue(value: number): string {
    return formatChartValue(value, this.valueFormat(), { chartType: this.type(), location: 'axis' });
  }

  protected formatAxisLabel(label: string): string {
    return formatChartLabel(label, this.labelFormat(), { chartType: this.type(), location: 'axis' });
  }

  /** Dash pattern for series `i` (solid for the first), or null to omit the attribute. */
  protected dashFor(i: number): string | null {
    return SERIES_DASH[i % SERIES_DASH.length] || null;
  }

  protected readonly layout = computed(() => {
    const series = this.cartesianSeries();
    const type = this.type();
    const height = this.height();
    const plotLeft = MARGIN.left;
    const plotRight = VIEW_W - MARGIN.right;
    const plotTop = MARGIN.top;
    const plotBottom = height - MARGIN.bottom;
    const n = Math.max(1, ...series.map((s) => s.data.length));

    const stacked = this.stacked() && (type === 'bar' || type === 'area');
    const stack = stacked ? stackSeries(series) : null;
    const ext = stack?.extent ?? seriesExtent(series, type !== 'line');
    const domain = resolveDomain(ext, this.yDomain());
    const tickValues = niceTicks(domain.ok ? domain.min : ext.min, domain.ok ? domain.max : ext.max, this.yTicks());
    const domMin = tickValues[0] ?? 0;
    const domMax = tickValues[tickValues.length - 1] ?? 1;

    const yAt = scaleLinear(domMin, domMax, plotBottom, plotTop);
    const xAt = scaleLinear(0, Math.max(1, n - 1), plotLeft, plotRight);
    const baselineY = yAt(domMin <= 0 && 0 <= domMax ? 0 : domMin);

    const bandWidth = (plotRight - plotLeft) / n;
    const groupWidth = bandWidth * 0.7;
    const barWidth = groupWidth / Math.max(1, series.length);

    const rendered: SeriesRender[] = stack
      ? stack.bands.map((band) => {
          const upperPoints = band.upper.map((value, i) => [xAt(i), yAt(value)] as [number, number]);
          const lowerPoints = band.lower.map((value, i) => [xAt(i), yAt(value)] as [number, number]);
          const colorIndex = (band.color ?? band.seriesIndex + 1) - 1;
          return {
            name: band.name,
            strokeClass: pick(SERIES_STROKE, colorIndex),
            fillClass: pick(SERIES_FILL, colorIndex),
            linePath: buildLinePath(upperPoints),
            areaPath: buildBandPath(upperPoints, lowerPoints),
            bars: band.upper.map((upper, i) => {
              const lower = band.lower[i] ?? 0;
              const yUpper = yAt(upper);
              const yLower = yAt(lower);
              return {
                x: plotLeft + i * bandWidth + (bandWidth - groupWidth) / 2,
                y: Math.min(yUpper, yLower),
                w: groupWidth,
                h: Math.abs(yLower - yUpper),
              };
            }),
          };
        })
      : series.map((s, si) => {
          const points = s.data.map((v, i) => [xAt(i), yAt(v)] as [number, number]);
          const bars = s.data.map((v, i) => {
            const x = plotLeft + i * bandWidth + (bandWidth - groupWidth) / 2 + si * barWidth;
            const yV = yAt(v);
            return { x, y: Math.min(yV, baselineY), w: barWidth, h: Math.abs(baselineY - yV) };
          });
          const colorIndex = (s.color ?? si + 1) - 1;
          return {
            name: s.name,
            strokeClass: pick(SERIES_STROKE, colorIndex),
            fillClass: pick(SERIES_FILL, colorIndex),
            linePath: buildLinePath(points),
            areaPath: buildAreaPath(points, baselineY),
            bars,
          };
        });

    const ticks = tickValues.map((value) => ({ value, y: yAt(value) }));
    const labels = this.labels();
    const xLabels = Array.from({ length: n }, (_, i) => ({ x: xAt(i), text: labels[i] ?? String(i + 1) }));

    return { plotLeft, plotRight, plotTop, plotBottom, n, xAt, yAt, rendered, ticks, xLabels };
  });

  protected readonly scatterSeries = computed(() => this.series().filter(isXYSeries));

  protected readonly scatterLayout = computed(() => {
    const series = this.scatterSeries();
    const height = this.height();
    const plotLeft = MARGIN.left;
    const plotRight = VIEW_W - MARGIN.right;
    const plotTop = MARGIN.top;
    const plotBottom = height - MARGIN.bottom;
    const domains = resolveScatterDomains(series, this.xDomain(), this.yDomain());
    const xValues = niceTicks(domains.ok ? domains.x.min : 0, domains.ok ? domains.x.max : 1, this.yTicks());
    const yValues = niceTicks(domains.ok ? domains.y.min : 0, domains.ok ? domains.y.max : 1, this.yTicks());
    const xAt = scaleLinear(xValues[0] ?? 0, xValues[xValues.length - 1] ?? 1, plotLeft, plotRight);
    const yAt = scaleLinear(yValues[0] ?? 0, yValues[yValues.length - 1] ?? 1, plotBottom, plotTop);

    return {
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
      xAt,
      yAt,
      points: mapScatterPoints(series, xAt, yAt),
      keyboardOrder: keyboardOrder(series),
      xTicks: xValues.map((value) => ({ value, x: xAt(value) })),
      yTicks: yValues.map((value) => ({ value, y: yAt(value) })),
    };
  });

  protected readonly radialSeries = computed(() => {
    const series = this.series()[0];
    return series && isRadialSeries(series) ? series : null;
  });

  protected readonly isRadial = computed(() => {
    const type = this.type();
    return (type === 'pie' || type === 'donut') && this.modelStatus() === 'ok';
  });

  protected readonly radialLayout = computed(() => {
    const padding = 16;
    const cx = VIEW_W / 2;
    const cy = this.height() / 2;
    const outerR = Math.max(0, Math.min(VIEW_W - padding * 2, this.height() - padding * 2) / 2);
    const innerR = this.type() === 'donut' ? outerR * clampDonutRatio(this.donutRatio()) : 0;
    const series = this.radialSeries();
    return { cx, cy, outerR, innerR, slices: series ? buildSlices(series, cx, cy, outerR, innerR) : [] };
  });

  protected readonly hover = computed(() => {
    const idx = this.hoverIndex();
    const series = this.cartesianSeries();
    if (idx === null || !this.isCartesian() || series.length === 0) return null;
    const L = this.layout();
    const cx = L.xAt(idx);
    const points = series.map((s, si) => {
      const value = s.data[idx] ?? 0;
      return {
        name: s.name,
        value: formatChartValue(value, this.valueFormat(), {
          chartType: this.type(),
          location: 'tooltip',
          seriesIndex: si,
          dataIndex: idx,
          seriesName: s.name,
          originalDatum: value,
        }),
        cy: L.yAt(value),
        fillClass: pick(SERIES_FILL, si),
      };
    });
    const label = formatChartLabel(this.labels()[idx] ?? String(idx + 1), this.labelFormat(), {
      chartType: this.type(),
      location: 'tooltip',
      dataIndex: idx,
    });
    const boxH = 20 + points.length * 13;
    const boxW = this.tooltipWidth([label, ...points.map((point) => `${point.name}: ${point.value}`)]);
    const boxX = cx > VIEW_W / 2 ? cx - boxW - 8 : cx + 8;
    return { cx, points, label, boxH, boxW, boxX };
  });

  protected readonly scatterHover = computed(() => {
    const point = this.scatterHoverPoint();
    if (!point || !this.isScatter()) return null;
    const L = this.scatterLayout();
    const formattedLabel = formatChartLabel(point.label, this.labelFormat(), {
      chartType: this.type(),
      location: 'tooltip',
      seriesIndex: point.seriesIndex,
      dataIndex: point.dataIndex,
      seriesName: point.seriesName,
      originalDatum: point.originalDatum,
    });
    const formattedValue = formatChartValue(point.y, this.valueFormat(), {
      chartType: this.type(),
      location: 'tooltip',
      seriesIndex: point.seriesIndex,
      dataIndex: point.dataIndex,
      seriesName: point.seriesName,
      originalDatum: point.originalDatum,
    });
    const boxW = this.tooltipWidth([point.seriesName, `${formattedLabel}: ${formattedValue}`]);
    return {
      ...point,
      formattedLabel,
      formattedValue,
      boxW,
      boxX: point.px > VIEW_W / 2 ? point.px - boxW - 8 : point.px + 8,
      boxY: Math.max(L.plotTop, Math.min(point.py - 17, L.plotBottom - 34)),
    };
  });

  protected readonly radialHover = computed(() => {
    const slice = this.radialHoverSlice();
    const series = this.radialSeries();
    if (!slice || !series || !this.isRadial()) return null;
    const context = {
      chartType: this.type(),
      location: 'tooltip' as const,
      seriesIndex: 0,
      dataIndex: slice.dataIndex,
      seriesName: series.name,
      originalDatum: slice.originalDatum,
    };
    const formattedLabel = formatChartLabel(slice.label, this.labelFormat(), context);
    const formattedValue = formatChartValue(slice.value, this.valueFormat(), context);
    return { ...slice, formattedLabel, formattedValue, boxW: this.tooltipWidth([formattedLabel, `${formattedValue} (${formatPercent(slice.fraction)})`]) };
  });

  private tooltipWidth(lines: readonly string[]): number {
    return Math.max(120, ...lines.map((line) => line.length * 6 + 16));
  }

  protected radialTooltipX(): number {
    const { cx } = this.radialLayout();
    return cx > VIEW_W / 2 ? cx - 128 : cx + 8;
  }

  protected radialTooltipY(): number {
    const { cy } = this.radialLayout();
    return Math.max(8, Math.min(cy - 17, this.height() - 42));
  }

  protected onMove(event: PointerEvent): void {
    const rect = (event.currentTarget as SVGGraphicsElement).getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    if (this.isScatter()) {
      const px = (event.clientX - rect.left) * (VIEW_W / rect.width);
      const py = (event.clientY - rect.top) * (this.height() / rect.height);
      const point = nearestScatterPoint(this.scatterLayout().points, px, py, SCATTER_HIT_RADIUS);
      this.scatterHoverPoint.set(point);
      this.setPointerEvent(point ? this.scatterPointEvent(point) : null);
      return;
    }
    if (this.isRadial()) {
      const px = (event.clientX - rect.left) * (VIEW_W / rect.width);
      const py = (event.clientY - rect.top) * (this.height() / rect.height);
      const { cx, cy, slices } = this.radialLayout();
      const slice = hitTestAngle(slices, pointerAngle(cx, cy, px, py));
      this.radialHoverSlice.set(slice);
      this.setPointerEvent(slice ? this.radialSliceEvent(slice) : null);
      return;
    }
    const index = nearestIndex(this.layout().n, (event.clientX - rect.left) / rect.width);
    this.hoverIndex.set(index);
    this.setPointerEvent(this.cartesianPointEvent(index));
  }

  protected onLeave(): void {
    this.hoverIndex.set(null);
    this.scatterHoverPoint.set(null);
    this.radialHoverSlice.set(null);
    this.pointerEvent.set(null);
    const keyboardEvent = this.keyboardEvent();
    if (this.svgFocused() && keyboardEvent) {
      this.showKeyboardEvent(keyboardEvent);
      this.pointHover.emit(keyboardEvent);
      return;
    }
    this.keyboardEvent.set(null);
    this.pointHover.emit(null);
  }

  protected onClick(): void {
    const event = this.activeEvent();
    if (event) this.pointClick.emit(event);
  }

  protected onFocus(): void {
    this.svgFocused.set(true);
    if (!this.keyboardEvent()) this.selectKeyboardEvent(this.firstKeyboardEvent());
  }

  protected onBlur(): void {
    this.svgFocused.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const selected = this.keyboardEvent() ?? this.firstKeyboardEvent();
    let next: ChartPointEvent | null;

    switch (event.key) {
      case 'ArrowLeft':
        next = this.moveKeyboardEvent(selected, -1, 'index');
        break;
      case 'ArrowRight':
        next = this.moveKeyboardEvent(selected, 1, 'index');
        break;
      case 'ArrowUp':
        if (this.isRadial()) return;
        next = this.moveKeyboardEvent(selected, -1, 'series');
        break;
      case 'ArrowDown':
        if (this.isRadial()) return;
        next = this.moveKeyboardEvent(selected, 1, 'series');
        break;
      case 'Home':
        next = this.edgeKeyboardEvent(selected, false);
        break;
      case 'End':
        next = this.edgeKeyboardEvent(selected, true);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onClick();
        return;
      case 'Escape':
        event.preventDefault();
        this.clearKeyboardEvent();
        return;
      default:
        return;
    }

    event.preventDefault();
    this.selectKeyboardEvent(next);
  }

  private setPointerEvent(event: ChartPointEvent | null): void {
    const previous = this.pointerEvent();
    this.pointerEvent.set(event);
    if (!this.samePoint(previous, event)) this.pointHover.emit(event);
  }

  private selectKeyboardEvent(event: ChartPointEvent | null): void {
    if (!event) return;
    const previous = this.keyboardEvent();
    this.keyboardEvent.set(event);
    this.showKeyboardEvent(event);
    this.liveAnnouncement.set(this.keyboardAnnouncement(event));
    if (!this.samePoint(previous, event)) this.pointHover.emit(event);
  }

  private clearKeyboardEvent(): void {
    this.keyboardEvent.set(null);
    this.hoverIndex.set(null);
    this.scatterHoverPoint.set(null);
    this.radialHoverSlice.set(null);
    this.liveAnnouncement.set('');
    if (!this.pointerEvent()) this.pointHover.emit(null);
  }

  private showKeyboardEvent(event: ChartPointEvent): void {
    if (this.isCartesian()) {
      this.hoverIndex.set(event.dataIndex);
      return;
    }
    if (this.isScatter()) {
      this.scatterHoverPoint.set(
        this.scatterLayout().points.find(
          (point) => point.seriesIndex === event.seriesIndex && point.dataIndex === event.dataIndex,
        ) ?? null,
      );
      return;
    }
    this.radialHoverSlice.set(this.radialLayout().slices.find((slice) => slice.dataIndex === event.dataIndex) ?? null);
  }

  private firstKeyboardEvent(): ChartPointEvent | null {
    if (this.modelStatus() !== 'ok') return null;
    if (this.isCartesian()) {
      const seriesIndex = this.cartesianSeries().findIndex((series) => series.data.length > 0);
      return seriesIndex < 0 ? null : this.cartesianPointEventAt(seriesIndex, 0);
    }
    if (this.isScatter()) {
      const point = this.scatterLayout().keyboardOrder[0];
      return point ? this.scatterPointEvent(point) : null;
    }
    const slice = this.radialLayout().slices[0];
    return slice ? this.radialSliceEvent(slice) : null;
  }

  private moveKeyboardEvent(
    event: ChartPointEvent | null,
    direction: -1 | 1,
    axis: 'index' | 'series',
  ): ChartPointEvent | null {
    if (!event) return this.firstKeyboardEvent();
    if (this.isCartesian()) {
      const series = this.cartesianSeries();
      if (axis === 'index') {
        const dataIndex = Math.max(0, Math.min((series[event.seriesIndex]?.data.length ?? 1) - 1, event.dataIndex + direction));
        return this.cartesianPointEventAt(event.seriesIndex, dataIndex);
      }
      const seriesIndex = Math.max(0, Math.min(series.length - 1, event.seriesIndex + direction));
      return this.cartesianPointEventAt(seriesIndex, event.dataIndex);
    }
    if (this.isScatter()) {
      const points = this.scatterLayout().keyboardOrder;
      if (axis === 'index') {
        const index = points.findIndex((point) => point.seriesIndex === event.seriesIndex && point.dataIndex === event.dataIndex);
        const point = points[Math.max(0, Math.min(points.length - 1, index + direction))];
        return point ? this.scatterPointEvent(point) : null;
      }
      const seriesIndex = Math.max(0, Math.min(this.scatterSeries().length - 1, event.seriesIndex + direction));
      const point = points.find((candidate) => candidate.seriesIndex === seriesIndex && candidate.dataIndex === event.dataIndex)
        ?? points.find((candidate) => candidate.seriesIndex === seriesIndex);
      return point ? this.scatterPointEvent(point) : null;
    }
    const slices = this.radialLayout().slices;
    const slice = slices[Math.max(0, Math.min(slices.length - 1, event.dataIndex + direction))];
    return slice ? this.radialSliceEvent(slice) : null;
  }

  private edgeKeyboardEvent(event: ChartPointEvent | null, last: boolean): ChartPointEvent | null {
    if (!event) return this.firstKeyboardEvent();
    if (this.isCartesian()) {
      const series = this.cartesianSeries()[event.seriesIndex];
      return series ? this.cartesianPointEventAt(event.seriesIndex, last ? series.data.length - 1 : 0) : null;
    }
    if (this.isScatter()) {
      const points = this.scatterLayout().keyboardOrder.filter((point) => point.seriesIndex === event.seriesIndex);
      const point = last ? points[points.length - 1] : points[0];
      return point ? this.scatterPointEvent(point) : null;
    }
    const slices = this.radialLayout().slices;
    const slice = last ? slices[slices.length - 1] : slices[0];
    return slice ? this.radialSliceEvent(slice) : null;
  }

  private keyboardAnnouncement(event: ChartPointEvent): string {
    const context = {
      chartType: event.chartType,
      location: 'live-region' as const,
      seriesIndex: event.seriesIndex,
      dataIndex: event.dataIndex,
      seriesName: event.seriesName,
      originalDatum: event.originalDatum,
    };
    const label = formatChartLabel(event.label, this.labelFormat(), context);
    const value = formatChartValue(event.value, this.valueFormat(), context);
    if (this.isRadial()) {
      const slice = this.radialLayout().slices.find((candidate) => candidate.dataIndex === event.dataIndex);
      return `${event.seriesName}, ${label}: ${value}${slice ? ` (${formatPercent(slice.fraction)})` : ''}`;
    }
    return `${event.seriesName}, ${label}: ${value}`;
  }

  private samePoint(a: ChartPointEvent | null, b: ChartPointEvent | null): boolean {
    return a === b || (a !== null && b !== null && a.chartType === b.chartType && a.seriesIndex === b.seriesIndex && a.dataIndex === b.dataIndex);
  }

  private cartesianPointEvent(dataIndex: number): ChartPointEvent | null {
    const seriesIndex = this.cartesianSeries().findIndex((series) => series.data[dataIndex] !== undefined);
    return seriesIndex < 0 ? null : this.cartesianPointEventAt(seriesIndex, dataIndex);
  }

  private cartesianPointEventAt(seriesIndex: number, dataIndex: number): ChartPointEvent | null {
    const series = this.cartesianSeries()[seriesIndex];
    const value = series?.data[dataIndex];
    if (!series || value === undefined) return null;
    return {
      chartType: this.type(),
      seriesIndex,
      dataIndex,
      seriesName: series.name,
      label: this.labels()[dataIndex] ?? String(dataIndex + 1),
      value,
      originalDatum: value,
    };
  }

  private scatterPointEvent(point: ScatterPointRef): ChartPointEvent {
    return {
      chartType: this.type(),
      seriesIndex: point.seriesIndex,
      dataIndex: point.dataIndex,
      seriesName: point.seriesName,
      label: point.label,
      value: point.y,
      x: point.x,
      originalDatum: point.originalDatum,
    };
  }

  private radialSliceEvent(slice: RadialSlice): ChartPointEvent | null {
    const series = this.radialSeries();
    if (!series) return null;
    return {
      chartType: this.type(),
      seriesIndex: 0,
      dataIndex: slice.dataIndex,
      seriesName: series.name,
      label: slice.label,
      value: slice.value,
      originalDatum: slice.originalDatum,
    };
  }
}
