/**
 * Grid — CSS Grid layout primitive. Configurable columns, gap, and
 * auto-flow. For 1-12 column responsive grids, prefer Tailwind's
 * `grid-cols-*` utilities directly; this primitive is for when you
 * need declarative control from the host.
 *
 * @example
 * <div axGrid cols="3" gap="4">
 *   <ax-card>One</ax-card>
 *   <ax-card>Two</ax-card>
 *   <ax-card>Three</ax-card>
 * </div>
 *
 * @example Auto-fit cards
 * <div axGrid [cols]="'auto-fill'" minColWidth="240px" gap="4">...</div>
 */

import { Directive, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';

export type AxGridCols = 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto-fill' | 'auto-fit';
export type AxGridGap = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16';

@Directive({
  selector: '[axGrid]',
  standalone: true,
  host: {
    '[class]': 'classes()',
    '[attr.data-ax-grid]': 'true',
  },
})
export class AxGridDirective {
  /** Number of columns. Use 'auto-fill' / 'auto-fit' with `minColWidth`. @default 1 */
  cols = input<AxGridCols>(1);

  /** Gap between cells. @default '4' */
  gap = input<AxGridGap>('4');

  /** Row gap (overrides `gap` for rows). */
  rowGap = input<AxGridGap | null>(null);

  /** Column gap (overrides `gap` for columns). */
  colGap = input<AxGridGap | null>(null);

  /** Minimum column width (used with 'auto-fill' / 'auto-fit'). @default '240px' */
  minColWidth = input<string>('240px');

  protected readonly classes = computed(() => {
    const tokens: string[] = ['grid'];
    const cols = this.cols();

    if (typeof cols === 'number') {
      tokens.push(`grid-cols-${cols}`);
    } else {
      // auto-fill / auto-fit — uses Tailwind arbitrary value with a CSS custom prop
      tokens.push(`[grid-template-columns:repeat(${cols},minmax(${this.minColWidth()},1fr))]`);
    }

    if (this.colGap() && this.rowGap()) {
      tokens.push(`gap-x-${this.colGap()}`, `gap-y-${this.rowGap()}`);
    } else if (this.colGap()) {
      tokens.push(`gap-x-${this.colGap()}`, `gap-y-${this.gap()}`);
    } else if (this.rowGap()) {
      tokens.push(`gap-x-${this.gap()}`, `gap-y-${this.rowGap()}`);
    } else {
      tokens.push(`gap-${this.gap()}`);
    }

    return cn(tokens);
  });
}
