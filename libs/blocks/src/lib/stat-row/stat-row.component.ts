import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AxStatisticComponent } from '@axisui-ng/data';

import type { StatItem } from '../blocks.types';

/** Literal column classes so Tailwind can scan them (interpolated classes are not detected). */
const COL_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

/**
 * Stat row — product metric band with hairline separators (not equal floating cards).
 * First stat is the primary: muted surface + stronger value/label hierarchy via
 * descendant token utilities on the composed ax-statistic. Data-driven via [stats];
 * projected default slot for an optional heading. Token-classed.
 */
@Component({
  selector: 'ax-stat-row',
  standalone: true,
  imports: [AxStatisticComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'group', class: 'block', '[attr.aria-label]': 'ariaLabel() || null' },
  template: `
    <ng-content />
    <div class="grid gap-px overflow-hidden rounded-card border border-border bg-border" [class]="gridClass()">
      @for (s of stats(); track s.label; let i = $index) {
        <div [class]="cellClass(i)">
          <ax-statistic
            [label]="s.label"
            [value]="s.value"
            [trend]="s.trend ?? null"
            [prefix]="s.prefix ?? ''"
            [suffix]="s.suffix ?? ''"
          />
        </div>
      }
    </div>
  `,
})
export class AxStatRowComponent {
  readonly stats = input<StatItem[]>([]);
  readonly columns = input<number>(0);
  readonly ariaLabel = input('');

  protected readonly gridClass = computed(() => COL_CLASS[this.columns()] ?? 'grid-cols-2 md:grid-cols-4');

  /**
   * Primary (first) cell: quiet surface + typographic scale-up on the composed
   * statistic (Tailwind utilities are global, so descendant selectors apply).
   */
  protected cellClass(index: number): string {
    if (index !== 0) {
      return 'flex flex-col justify-center bg-card px-5 py-4 [&_span.tabular-nums]:text-xl [&_span.tabular-nums]:font-semibold [&_span.tabular-nums]:tracking-tight';
    }
    return [
      'flex flex-col justify-center bg-muted/40 px-5 py-4',
      '[&_span.text-muted-foreground]:text-xs',
      '[&_span.text-muted-foreground]:font-medium',
      '[&_span.text-muted-foreground]:uppercase',
      '[&_span.text-muted-foreground]:tracking-wide',
      '[&_span.tabular-nums]:text-3xl',
      '[&_span.tabular-nums]:font-semibold',
      '[&_span.tabular-nums]:tracking-tight',
    ].join(' ');
  }
}
