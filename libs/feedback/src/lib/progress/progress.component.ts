import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';
import { progressTrackVariants, type ProgressSize } from './progress.variants';

/**
 * Progress — determinate or indeterminate progress bar.
 *
 * The fill width is dynamic data, so it is applied via a whole-object [style]
 * binding (per-property [style.*] bindings are forbidden by house convention).
 *
 * @example <ax-progress [value]="75" />
 * @example <ax-progress [value]="null" />  <!-- indeterminate -->
 */
@Component({
  selector: 'ax-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.aria-valuenow]': 'value() === null ? null : value()',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'max()',
    '[attr.data-state]': 'value() === null ? "indeterminate" : "determinate"',
    class: 'block',
  },
  template: `
    <div [class]="trackClasses()">
      <div
        class="ax-progress__fill h-full bg-primary transition-[width] duration-[var(--duration)] ease-out-quart motion-reduce:animate-none"
        [class.animate-pulse]="value() === null"
        [style]="fillStyle()"
      ></div>
    </div>
  `,
})
export class AxProgressComponent {
  /** Current value; null = indeterminate. @default null */
  value = input<number | null>(null);
  /** Maximum value. @default 100 */
  max = input<number>(100);
  /** Track thickness. @default 'md' */
  size = input<ProgressSize>('md');
  /** Accessible name for the progressbar. @default 'Progress' */
  ariaLabel = input<string>('Progress');

  protected readonly trackClasses = computed(() => cn(progressTrackVariants({ size: this.size() })));

  /** Fill width as a style object. Indeterminate → 40% (animated pulse). */
  protected readonly fillStyle = computed<Record<string, string>>(() => {
    const v = this.value();
    if (v === null) return { width: '40%' };
    const pct = Math.max(0, Math.min(100, (v / this.max()) * 100));
    return { width: `${pct}%` };
  });
}
