/**
 * Heading — the typographic primitive for section and page titles. Applies the
 * display end of the type scale plus heading-appropriate weight, tracking, and
 * balanced wrapping. Put it on a real `<h1>`–`<h6>` so the document outline stays
 * correct; the directive styles the element, it never changes the tag.
 *
 * Conventions demonstrated:
 *   - Standalone directive, signal inputs only, `cn()` composition
 *   - Logical CSS only; scale-only (no hardcoded `font-size` / `line-height`)
 *   - `text-wrap: balance` on by default — even line lengths for short titles
 *
 * @example
 * <h1 axHeading size="3xl">Account settings</h1>
 * <h2 axHeading size="xl" tone="muted">Security</h2>
 */

import { Directive, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';
import type { AxTextAlign, AxTextTone } from '../text/text.directive';

export type AxHeadingSize = 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
export type AxHeadingWeight = 'medium' | 'semibold' | 'bold';
export type AxHeadingTracking = 'tight' | 'normal';

const TONE: Record<AxTextTone, string> = {
  default: '',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  destructive: 'text-destructive',
};

const ALIGN: Record<AxTextAlign, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
};

@Directive({
  selector: '[axHeading]',
  standalone: true,
  host: {
    '[class]': 'classes()',
    '[attr.data-ax-heading]': 'true',
  },
})
export class AxHeadingDirective {
  /** Type-scale step (size + paired line-height). @default 'xl' */
  size = input<AxHeadingSize>('xl');

  /** Font weight. @default 'semibold' */
  weight = input<AxHeadingWeight>('semibold');

  /** Letter spacing. Headings default to a slight negative tracking. @default 'tight' */
  tracking = input<AxHeadingTracking>('tight');

  /** Semantic text color. @default 'default' (inherits the foreground token) */
  tone = input<AxTextTone>('default');

  /** Inline text alignment (logical — never left/right). @default null (inherits) */
  align = input<AxTextAlign | null>(null);

  /** Balance line lengths (`text-wrap: balance`). @default true */
  balance = input<boolean>(true);

  /** Truncate to a single line with an ellipsis. @default false */
  truncate = input<boolean>(false);

  /** Resolved class string — composed via cn(). */
  protected readonly classes = computed(() => {
    const c: string[] = [`text-${this.size()}`, `font-${this.weight()}`];

    if (this.tracking() !== 'normal') c.push(`tracking-${this.tracking()}`);
    if (TONE[this.tone()]) c.push(TONE[this.tone()]);

    const align = this.align();
    if (align) c.push(ALIGN[align]);

    if (this.balance()) c.push('text-balance');
    if (this.truncate()) c.push('truncate');

    return cn(c);
  });
}
