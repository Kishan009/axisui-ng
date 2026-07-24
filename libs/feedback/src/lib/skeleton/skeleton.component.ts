import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';
import { skeletonVariants, type SkeletonVariant } from './skeleton.variants';

/**
 * Skeleton — loading placeholder. Stack multiples to mirror a layout.
 *
 * Width/height are genuinely dynamic, per-instance data (e.g. '60%', '120px'),
 * so they are applied via a whole-object [style] binding rather than Tailwind
 * classes — arbitrary runtime dimensions cannot be expressed as static utilities.
 *
 * @example <ax-skeleton variant="text" width="60%" />
 */
@Component({
  selector: 'ax-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[style]': 'dims()',
    'aria-hidden': 'true',
  },
  template: ``,
})
export class AxSkeletonComponent {
  /** Shape. @default 'rect' */
  variant = input<SkeletonVariant>('rect');
  /** CSS width override (e.g. '60%', '120px'). @default null */
  width = input<string | null>(null);
  /** CSS height override. @default null */
  height = input<string | null>(null);

  protected readonly classes = computed(() => cn('ax-skeleton', skeletonVariants({ variant: this.variant() })));

  /** Inline dimensions, omitted when null so they don't override the variant defaults. */
  protected readonly dims = computed<Record<string, string>>(() => {
    const style: Record<string, string> = {};
    const w = this.width();
    const h = this.height();
    if (w) style['width'] = w;
    if (h) style['height'] = h;
    return style;
  });
}
