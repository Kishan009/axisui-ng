/**
 * ScrollArea — a scroll container with consistent, token-themed scrollbars
 * across browsers (Firefox `scrollbar-*` + WebKit `::-webkit-scrollbar`
 * pseudo-elements, expressed as Tailwind arbitrary utilities so no extra
 * stylesheet is needed). The host *is* the scrollport: the consumer gives it a
 * bounded size (e.g. `class="h-72 w-full"`) and projects content into it.
 *
 * A11y: the scrollport is focusable (`tabindex=0`) so keyboard users can scroll
 * it (satisfies axe `scrollable-region-focusable`). Pass `ariaLabel` to also
 * expose it as a labelled `region` landmark.
 *
 * @example
 * <ax-scroll-area orientation="vertical" class="h-72 w-full rounded-md border">
 *   …long content…
 * </ax-scroll-area>
 */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { cn } from '../_utils/cn';

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both';

const OVERFLOW: Record<ScrollAreaOrientation, string> = {
  vertical: 'overflow-y-auto overflow-x-hidden',
  horizontal: 'overflow-x-auto overflow-y-hidden',
  both: 'overflow-auto',
};

/** Cross-browser styled scrollbar (thin, rounded, token-coloured). */
const SCROLLBAR =
  '[scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent] ' +
  '[&::-webkit-scrollbar]:size-2 ' +
  '[&::-webkit-scrollbar-track]:bg-transparent ' +
  '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border ' +
  '[&::-webkit-scrollbar-thumb]:transition-[background-color] [&::-webkit-scrollbar-thumb]:duration-[var(--duration-fast)] [&::-webkit-scrollbar-thumb]:ease-out-quart ' +
  '[&::-webkit-scrollbar-thumb:hover]:bg-muted-foreground/40 ' +
  '[&::-webkit-scrollbar-thumb:active]:bg-muted-foreground/60';

@Component({
  selector: 'ax-scroll-area',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.tabindex]': '0',
    '[attr.role]': "ariaLabel() ? 'region' : null",
    '[attr.aria-label]': 'ariaLabel()',
    '[attr.data-orientation]': 'orientation()',
  },
  template: '<ng-content></ng-content>',
})
export class AxScrollAreaComponent {
  /** Which axis scrolls. @default 'vertical' */
  orientation = input<ScrollAreaOrientation>('vertical');

  /** Optional label — when set, the scrollport becomes a `region` landmark. */
  ariaLabel = input<string | null>(null);

  protected readonly classes = computed(() =>
    cn(
      'block outline-none transition-[box-shadow] duration-[var(--duration-fast)] ease-out-quart',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      OVERFLOW[this.orientation()],
      SCROLLBAR,
    ),
  );
}
