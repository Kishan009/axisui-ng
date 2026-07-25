/**
 * IconButton — a square (or circular) button that contains only an icon.
 *
 * Conventions demonstrated:
 *   - Standalone, OnPush
 *   - Signal inputs/outputs
 *   - cn() + cva
 *   - A11y: requires an accessible label via the `ariaLabel` input (or
 *     `aria-label` attribute on the host). This is enforced at the
 *     spec level.
 *   - Icon slot is the whole content; no leading/trailing distinction.
 *
 * @example
 * <ax-icon-button ariaLabel="Add item" variant="primary" (clickEvent)="onAdd()">
 *   <ax-icon name="plus" />
 * </ax-icon-button>
 *
 * @example Circle shape
 * <ax-icon-button ariaLabel="Close" shape="circle" variant="ghost">
 *   <ax-icon name="x" />
 * </ax-icon-button>
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  isDevMode,
  output,
} from '@angular/core';

import { cn } from '../_utils/cn';
import { iconButtonVariants, type IconButtonShape, type IconButtonSize, type IconButtonVariant } from './icon-button.variants';

@Component({
  selector: 'ax-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
    '[class.ax-icon-button]': 'true',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
  },
  template: `
    <button
      type="button"
      [class]="classes()"
      [attr.aria-label]="resolvedAriaLabel()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
      [disabled]="disabled() || loading()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <svg class="ax-icon-button__spinner animate-spin motion-reduce:animate-none" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
      } @else {
        <span class="ax-icon-button__icon inline-flex size-full items-center justify-center leading-none">
          <ng-content></ng-content>
        </span>
      }
    </button>
  `,
})
export class AxIconButtonComponent implements OnInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Visual style. @default 'ghost' (most common for icon buttons in toolbars). */
  variant = input<IconButtonVariant>('ghost');

  /** Bounding box size. @default 'md' */
  size = input<IconButtonSize>('md');

  /** Square or fully rounded. @default 'square' */
  shape = input<IconButtonShape>('square');

  /** Disabled state. @default false */
  disabled = input<boolean>(false);

  /** Loading state — suppresses click. @default false */
  loading = input<boolean>(false);

  /** Required for a11y. Provides the accessible name for the button. */
  ariaLabel = input<string | null>(null);

  /** Emitted on click. Suppressed if disabled or loading. */
  readonly clickEvent = output<MouseEvent>();

  protected readonly classes = computed(() =>
    cn(iconButtonVariants({ variant: this.variant(), size: this.size(), shape: this.shape() }))
  );

  ngOnInit(): void {
    // An icon-only button with no accessible name is invisible to screen readers
    // (WCAG 4.1.2). Surface it loudly in dev so it's caught before shipping.
    if (isDevMode() && !this.resolvedAriaLabel()) {
      console.warn(
        '[ax-icon-button] Missing accessible name. Set [ariaLabel] (or an aria-label ' +
          'attribute on the host). An icon-only button with no label is inaccessible.',
      );
    }
  }

  /**
   * The accessible name for the inner button: the `ariaLabel` input wins, then a
   * host `aria-label` (forwarded so the documented host-attribute path actually
   * works). Returns `null` — never an empty string — so the attribute is removed
   * rather than set to "", which would still leave the button unnamed.
   */
  protected resolvedAriaLabel(): string | null {
    // `||` (not `??`) so an empty-string input is treated as "no label" and
    // falls through to a host aria-label, then to null (attribute removed).
    return this.ariaLabel() || this.host.nativeElement.getAttribute('aria-label') || null;
  }

  protected onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clickEvent.emit(event);
  }
}
