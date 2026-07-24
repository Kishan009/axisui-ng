import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { buildAreaPath, buildLinePath, sparkPoints } from '../chart/chart-core';

const STROKE = ['stroke-chart-1', 'stroke-chart-2', 'stroke-chart-3', 'stroke-chart-4', 'stroke-chart-5'];
const FILL = ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5'];

/**
 * Sparkline — a compact inline line/area trend (no axes). Reuses chart-core
 * (sparkPoints + path builders); colored via the chart palette utility classes
 * so it auto-themes.
 */
@Component({
  selector: 'ax-sparkline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-block' },
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + width() + ' ' + height()"
      [attr.width]="width()"
      [attr.height]="height()"
      role="img"
      [attr.aria-label]="resolvedAriaLabel()"
      xmlns="http://www.w3.org/2000/svg"
    >
      @if (type() === 'area') {
        <path [attr.d]="areaPath()" [attr.class]="fillClass()" stroke="none" opacity="0.15" />
      }
      <path [attr.d]="linePath()" [attr.class]="strokeClass()" fill="none" stroke-width="2" />
      @if (showDot() && lastPoint(); as p) {
        <circle [attr.cx]="p[0]" [attr.cy]="p[1]" r="2.5" [attr.class]="fillClass()" />
      }
    </svg>
  `,
})
export class AxSparklineComponent {
  readonly data = input<number[]>([]);
  readonly type = input<'line' | 'area'>('line');
  readonly colorIndex = input(1);
  readonly showDot = input(false);
  readonly width = input(120);
  readonly height = input(32);
  readonly ariaLabel = input('');

  private readonly points = computed(() => sparkPoints(this.data(), this.width(), this.height(), 2));
  protected readonly linePath = computed(() => buildLinePath(this.points()));
  protected readonly areaPath = computed(() => buildAreaPath(this.points(), this.height() - 2));
  protected readonly lastPoint = computed<[number, number] | null>(() => {
    const p = this.points();
    return p.length ? p[p.length - 1]! : null;
  });

  private readonly idx = computed(() => Math.min(5, Math.max(1, this.colorIndex())) - 1);
  protected readonly strokeClass = computed(() => STROKE[this.idx()]!);
  protected readonly fillClass = computed(() => FILL[this.idx()]!);

  /**
   * Accessible name: an explicit `ariaLabel` wins; otherwise summarize the series
   * (count, trend, latest value, range) so screen-reader users get the meaning a
   * sighted user reads off the curve — not just the word "Sparkline".
   */
  protected readonly resolvedAriaLabel = computed(() => {
    const custom = this.ariaLabel();
    if (custom) return custom;
    const d = this.data();
    if (!d.length) return 'Sparkline, no data';
    const first = d[0]!;
    const last = d[d.length - 1]!;
    const trend = last > first ? 'trending up' : last < first ? 'trending down' : 'flat';
    return `Sparkline, ${d.length} points, ${trend}, latest ${last}, range ${Math.min(...d)} to ${Math.max(...d)}`;
  });
}
