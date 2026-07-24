/**
 * Stack — vertical layout primitive. Children are stacked with
 * a consistent gap along the block axis. Switch to `direction="horizontal"`
 * to get a row (then use Cluster if you want wrapping).
 *
 * Conventions:
 *   - Standalone directive
 *   - Signal inputs only
 *   - cn() + logical CSS (gap uses Tailwind's `gap-*` which is axis-agnostic)
 *   - `align` and `justify` follow flex conventions but map to logical
 *     properties so they work in RTL.
 *
 * @example
 * <div axStack gap="4" align="stretch">
 *   <div>One</div>
 *   <div>Two</div>
 * </div>
 */

import { Directive, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';

export type AxStackDirection = 'vertical' | 'horizontal';
export type AxStackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type AxStackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type AxStackGap = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16';

@Directive({
  selector: '[axStack]',
  standalone: true,
  host: {
    '[class]': 'classes()',
    '[attr.data-ax-stack]': 'true',
    '[attr.data-direction]': 'direction()',
  },
})
export class AxStackDirective {
  /** Stack direction. 'vertical' = block axis, 'horizontal' = inline axis. @default 'vertical' */
  direction = input<AxStackDirection>('vertical');

  /** Gap between children. @default '4' */
  gap = input<AxStackGap>('4');

  /** Cross-axis alignment (flex `align-items`). @default 'stretch' */
  align = input<AxStackAlign>('stretch');

  /** Main-axis distribution (flex `justify-content`). @default 'start' */
  justify = input<AxStackJustify>('start');

  /** Allow wrapping along the main axis. @default false */
  wrap = input<boolean>(false);

  protected readonly classes = computed(() => {
    const tokens: string[] = ['flex'];

    tokens.push(this.direction() === 'vertical' ? 'flex-col' : 'flex-row');
    if (this.wrap()) tokens.push('flex-wrap');

    tokens.push(`gap-${this.gap()}`);
    tokens.push(`items-${this.align()}`);
    tokens.push(`justify-${this.justify()}`);

    return cn(tokens);
  });
}
