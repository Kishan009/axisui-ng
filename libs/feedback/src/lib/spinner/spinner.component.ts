import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';
import { spinnerVariants, type SpinnerSize } from './spinner.variants';

/**
 * Spinner — CSS border spinner. Color inherits via currentColor.
 *
 * @example <ax-spinner size="md" ariaLabel="Loading results" />
 */
@Component({
  selector: 'ax-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', '[attr.aria-label]': 'ariaLabel()' },
  template: `<span [class]="classes()"></span>`,
})
export class AxSpinnerComponent {
  /** Size. @default 'md' */
  size = input<SpinnerSize>('md');
  /** Accessible label announced by screen readers. @default 'Loading' */
  ariaLabel = input<string>('Loading');

  protected readonly classes = computed(() => cn('ax-spinner', spinnerVariants({ size: this.size() })));
}
