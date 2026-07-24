/**
 * Box — the most primitive layout primitive. A bare `<div>` (or custom element)
 * that accepts padding, border, radius, and color tokens via signal inputs.
 *
 * The point of Box: it absorbs the dozens of single-property utility
 * classes that would otherwise litter templates. Use it as a
 * layout-agnostic container.
 *
 * Conventions demonstrated:
 *   - Standalone directive, no component (no view encapsulation needed)
 *   - Signal inputs only — no @Input
 *   - cn() for class composition
 *   - Logical CSS only (`p`, `m`, `ps`, `pe`, `ms`, `me` etc. via Tailwind)
 *   - Defaults to `display: block`; switch to inline / flex / grid via the `display` input
 *
 * @example
 * <div axBox p="4" bg="card" rounded="md">Hello</div>
 *
 * @example Polymorphic
 * <section axBox as="section" p="6" bg="muted">A section</section>
 */

import { Directive, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';

export type AxBoxDisplay = 'block' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'inline-grid' | 'none';
export type AxBoxPadding = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12';
export type AxBoxRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type AxBoxShadow = 'none' | 'sm' | 'md' | 'lg' | 'xl';

@Directive({
  selector: '[axBox]',
  standalone: true,
  host: {
    '[class]': 'classes()',
    '[attr.data-ax-box]': 'true',
  },
})
export class AxBoxDirective {
  /** Display mode. @default 'block' */
  display = input<AxBoxDisplay>('block');

  /** Padding on all sides (Tailwind spacing scale). @default '0' */
  p = input<AxBoxPadding>('0');

  /** Padding inline-start (left in LTR, right in RTL). */
  ps = input<AxBoxPadding | null>(null);

  /** Padding inline-end (right in LTR, left in RTL). */
  pe = input<AxBoxPadding | null>(null);

  /** Padding block-start (top). */
  pt = input<AxBoxPadding | null>(null);

  /** Padding block-end (bottom). */
  pb = input<AxBoxPadding | null>(null);

  /** Background color (semantic token, e.g. 'card', 'muted', 'background'). */
  bg = input<string | null>(null);

  /** Foreground / text color (semantic token, e.g. 'foreground', 'muted-foreground'). */
  fg = input<string | null>(null);

  /** Border radius. @default 'none' */
  rounded = input<AxBoxRadius>('none');

  /** Box shadow. @default 'none' */
  shadow = input<AxBoxShadow>('none');

  /** Border (semantic token, e.g. 'border'). */
  border = input<boolean>(false);

  /** Resolved class string. */
  protected readonly classes = computed(() => {
    const tokens: string[] = [`${this.display()}`];

    if (this.p() !== '0') tokens.push(`p-${this.p()}`);
    if (this.ps()) tokens.push(`ps-${this.ps()}`);
    if (this.pe()) tokens.push(`pe-${this.pe()}`);
    if (this.pt()) tokens.push(`pt-${this.pt()}`);
    if (this.pb()) tokens.push(`pb-${this.pb()}`);

    if (this.bg()) tokens.push(`bg-${this.bg()}`);
    if (this.fg()) tokens.push(`text-${this.fg()}`);
    if (this.border()) tokens.push('border border-border');

    if (this.rounded() !== 'none') tokens.push(`rounded-${this.rounded()}`);
    if (this.shadow() !== 'none') tokens.push(`shadow-${this.shadow()}`);

    return cn(tokens);
  });
}
