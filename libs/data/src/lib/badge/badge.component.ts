import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';
import {
  badgeVariants,
  type BadgeAppearance,
  type BadgeSize,
  type BadgeVariant,
} from './badge.variants';

/**
 * Badge — compact status/label pill. Content via projection.
 *
 * @example <ax-badge variant="success">Active</ax-badge>
 * @example <ax-badge variant="info" appearance="soft">Beta</ax-badge>
 */
@Component({
  selector: 'ax-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-variant]': 'variant()', '[attr.data-appearance]': 'appearance()' },
  template: `<span [class]="classes()"><ng-content /></span>`,
})
export class AxBadgeComponent {
  /** Visual style. @default 'default' */
  variant = input<BadgeVariant>('default');
  /** Fill style: `solid` (default) or `soft` tinted pill. @default 'solid' */
  appearance = input<BadgeAppearance>('solid');
  /** Size. @default 'md' */
  size = input<BadgeSize>('md');

  protected readonly classes = computed(() =>
    cn(
      'ax-badge',
      badgeVariants({
        variant: this.variant(),
        appearance: this.appearance(),
        size: this.size(),
      })
    )
  );
}
