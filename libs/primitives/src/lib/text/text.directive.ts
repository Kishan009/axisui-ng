/**
 * Text — the typographic primitive for body, label, and inline copy. Applies the
 * design-system type scale (size + paired line-height), weight, tone, tracking,
 * transform, alignment, and wrapping to a native text element (`<p>`, `<span>`,
 * `<label>`, …), so the author keeps the semantic tag while the directive owns
 * the styling.
 *
 * Conventions demonstrated:
 *   - Standalone directive, no view (no encapsulation needed)
 *   - Signal inputs only — no `@Input`
 *   - `cn()` for class composition
 *   - Logical CSS only (`text-start` / `text-end`, never `text-left` / `text-right`)
 *   - Scale-only: never hardcodes `font-size` / `line-height`
 *
 * @example
 * <p axText>Default body copy (sm step).</p>
 *
 * @example Muted caption
 * <span axText size="xs" tone="muted">Last updated 2m ago</span>
 *
 * @example Uppercase section label
 * <span axText size="xs" tone="muted" transform="upper" tracking="wide">Section</span>
 */

import { Directive, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';

export type AxTextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl';
export type AxTextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type AxTextTone = 'default' | 'muted' | 'primary' | 'destructive';
export type AxTextTracking = 'tight' | 'normal' | 'wide';
export type AxTextTransform = 'none' | 'upper' | 'lower' | 'caps';
export type AxTextAlign = 'start' | 'center' | 'end';
export type AxTextWrap = 'pretty' | 'balance' | 'nowrap';

const TONE: Record<AxTextTone, string> = {
  default: '',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  destructive: 'text-destructive',
};

const TRANSFORM: Record<AxTextTransform, string> = {
  none: '',
  upper: 'uppercase',
  lower: 'lowercase',
  caps: 'capitalize',
};

const ALIGN: Record<AxTextAlign, string> = {
  start: 'text-start',
  center: 'text-center',
  end: 'text-end',
};

const WRAP: Record<AxTextWrap, string> = {
  pretty: 'text-pretty',
  balance: 'text-balance',
  nowrap: 'whitespace-nowrap',
};

@Directive({
  selector: '[axText]',
  standalone: true,
  host: {
    '[class]': 'classes()',
    '[attr.data-ax-text]': 'true',
  },
})
export class AxTextDirective {
  /** Type-scale step (size + paired line-height). @default 'sm' */
  size = input<AxTextSize>('sm');

  /** Font weight. @default 'normal' */
  weight = input<AxTextWeight>('normal');

  /** Semantic text color. @default 'default' (inherits the foreground token) */
  tone = input<AxTextTone>('default');

  /** Letter spacing. @default 'normal' */
  tracking = input<AxTextTracking>('normal');

  /** Text casing transform. @default 'none' */
  transform = input<AxTextTransform>('none');

  /** Inline text alignment (logical — never left/right). @default null (inherits) */
  align = input<AxTextAlign | null>(null);

  /** Text wrapping / balancing for prose. @default null */
  wrap = input<AxTextWrap | null>(null);

  /** Truncate to a single line with an ellipsis. @default false */
  truncate = input<boolean>(false);

  /** Use the monospace family (code, token values, tabular data). @default false */
  mono = input<boolean>(false);

  /** Resolved class string — composed via cn(). */
  protected readonly classes = computed(() => {
    const c: string[] = [`text-${this.size()}`];

    if (this.weight() !== 'normal') c.push(`font-${this.weight()}`);
    if (TONE[this.tone()]) c.push(TONE[this.tone()]);
    if (this.tracking() !== 'normal') c.push(`tracking-${this.tracking()}`);
    if (TRANSFORM[this.transform()]) c.push(TRANSFORM[this.transform()]);

    const align = this.align();
    if (align) c.push(ALIGN[align]);

    const wrap = this.wrap();
    if (wrap) c.push(WRAP[wrap]);

    if (this.truncate()) c.push('truncate');
    if (this.mono()) c.push('font-mono');

    return cn(c);
  });
}
