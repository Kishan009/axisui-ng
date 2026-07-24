import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';

import { formatStatValue } from './statistic-format';

/**
 * Statistic — a labeled metric with optional prefix/suffix and a trend indicator.
 *
 * @example
 * <ax-statistic label="Revenue" [value]="42500" prefix="$" [trend]="12" locale="en-US" />
 */
@Component({
  selector: 'ax-statistic',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: { class: 'inline-flex flex-col gap-1' },
  template: `
    @if (label()) {
      <span class="text-sm text-foreground/80">{{ label() }}</span>
    }
    <span class="text-2xl font-semibold tabular-nums text-foreground">{{ prefix() }}{{ formatted() }}{{ suffix() }}</span>
    @if (trend() !== null) {
      <span class="inline-flex items-center gap-1 text-sm" [class]="trendColor()" [attr.aria-label]="trendLabel()">
        <ax-icon [name]="trendIcon()" [size]="16" aria-hidden="true" />
        {{ trendMagnitude() }}
      </span>
    }
  `,
})
export class AxStatisticComponent {
  /** Caption above the value. @default '' */
  readonly label = input<string>('');
  /** The metric. Numbers are Intl-formatted. @default 0 */
  readonly value = input<number | string>(0);
  /** Leading text (e.g. '$'). @default '' */
  readonly prefix = input<string>('');
  /** Trailing text (e.g. '%'). @default '' */
  readonly suffix = input<string>('');
  /** Locale for Intl.NumberFormat. @default undefined */
  readonly locale = input<string | undefined>(undefined);
  /** Intl.NumberFormat options (applied to numeric values). @default null */
  readonly formatOptions = input<Intl.NumberFormatOptions | null>(null);
  /** Positive → up/success, negative → down/destructive; null hides the row. @default null */
  readonly trend = input<number | null>(null);

  protected readonly formatted = computed(() => formatStatValue(this.value(), this.locale(), this.formatOptions()));
  protected readonly trendIcon = computed(() => ((this.trend() ?? 0) >= 0 ? 'chevron-up' : 'chevron-down'));
  protected readonly trendColor = computed(() => ((this.trend() ?? 0) >= 0 ? 'text-success' : 'text-destructive'));
  protected readonly trendMagnitude = computed(() => Math.abs(this.trend() ?? 0));
  protected readonly trendLabel = computed(() => `${(this.trend() ?? 0) >= 0 ? 'up' : 'down'} ${Math.abs(this.trend() ?? 0)}`);
}
