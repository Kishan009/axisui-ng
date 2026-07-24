/**
 * AxIconComponent — renders a first-party icon from the registry.
 *
 * Conventions:
 *   - Standalone, OnPush
 *   - Signal inputs only
 *   - The `name` input is typed as a union of all registered icon
 *     names — typos are TypeScript errors.
 *   - SVG output uses `currentColor` so the icon inherits the text
 *     color from its parent context.
 *   - Default size 16, default stroke 2 (Lucide-style).
 *
 * @example
 * <ax-icon name="check" />
 * <ax-icon name="chevron-down" [size]="20" />
 * <ax-icon name="spinner" class="animate-spin" />
 *
 * @example Inside a Button slot
 * <ax-button>
 *   <ax-icon axButtonLeading name="plus" />
 *   Add item
 * </ax-button>
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';

import { cn } from './_utils/cn';
import { FALLBACK_ICON_NAME, ICON_REGISTRY, type AxIconName } from './registry';

@Component({
  selector: 'ax-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.data-ax-icon]': 'name()',
    // Decorative by default (aria-hidden). Set [label] to make the icon meaningful:
    // it then becomes role="img" with an accessible name and is no longer hidden.
    '[attr.aria-hidden]': 'label() ? null : "true"',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label()',
  },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="resolvedSize()"
      [attr.height]="resolvedSize()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      [innerHTML]="safeInner()"
    ></svg>
  `,
})
export class AxIconComponent {
  /**
   * Name of the icon. Must be a key in ICON_REGISTRY (typed as a
   * union). If a name is missing, the component renders the
   * `help-circle` fallback.
   */
  name = input.required<AxIconName>();

  /**
   * Size of the icon in pixels. Accepts a number (interpreted as px)
   * or a CSS length string (e.g. '1em', '1.25rem'). @default 16
   */
  size = input<number | string>(16);

  /** Stroke width. @default 2 */
  strokeWidth = input<number | string>(2);

  /**
   * Accessible name. When set, the icon is treated as meaningful content
   * (`role="img"` + `aria-label`) instead of decorative (`aria-hidden`). Use for
   * standalone informative icons that aren't already labelled by adjacent text.
   * @default null
   */
  label = input<string | null>(null);

  /** Extra utility classes appended to the host. */
  class = input<string | null>(null);

  /** Resolved numeric/px size as a string. */
  protected readonly resolvedSize = computed<string>(() => {
    const s = this.size();
    return typeof s === 'number' ? `${s}` : s;
  });

  /** Resolved class string for the host element. */
  protected readonly classes = computed(() => cn('inline-block shrink-0', this.class()));

  private readonly sanitizer = inject(DomSanitizer);

  /**
   * SVG inner content (path data, circles, etc.) for the requested icon,
   * marked trusted so Angular's DomSanitizer does not strip the SVG shape
   * elements (`<path>`, `<circle>`, `<line>`, `<polyline>`, `<polygon>`,
   * `<rect>`) that are absent from its allowed-HTML element list.
   *
   * Bypassing is safe here: every value comes from the hard-coded,
   * first-party ICON_REGISTRY — it is never user input.
   */
  protected readonly safeInner = computed<SafeHtml>(() => {
    const n = this.name();
    const raw = ICON_REGISTRY[n] ?? ICON_REGISTRY[FALLBACK_ICON_NAME];
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });
}
