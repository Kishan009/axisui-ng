/**
 * Button — the canonical pattern for every component in the library.
 *
 * Conventions demonstrated:
 *   - Standalone component, OnPush change detection
 *   - Signal inputs (no @Input), signal output (no @Output)
 *   - cva variants in a separate file
 *   - cn() for class composition
 *   - Icon slots via marker directives (axButtonLeading / axButtonTrailing)
 *   - JSDoc on every public input/output
 *   - Logical CSS only (no margin-left, no padding-right)
 *   - Density/trust tier cascade from @theme tokens, not from inputs
 *
 * Copy this file when adding any new component.
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  output,
} from '@angular/core';

import { cn } from '../_utils/cn';
import {
  AxButtonLeadingDirective,
  AxButtonTrailingDirective,
} from '../_utils/icon-slot.directive';
import { buttonVariants, type ButtonSize, type ButtonVariant } from './button.variants';

/**
 * Button — interactive trigger for actions.
 *
 * Variants: primary, secondary, ghost, outline, destructive, link
 * Sizes: sm (28px), md (36px), lg (44px)
 * Density: inherited from `data-density` on ancestor
 * Trust tier: inherited from `data-trust` on ancestor (regulated = confirmation on destructive)
 * Industry: inherited from `data-industry` on ancestor (changes accent + radius)
 *
 * @example
 * <ax-button variant="primary" size="md" (clickEvent)="onSubmit()">Submit</ax-button>
 *
 * @example With leading icon
 * <ax-button>
 *   <ax-icon axButtonLeading name="plus" />
 *   Add item
 * </ax-button>
 */
@Component({
  selector: 'ax-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  host: {
    class: 'inline-flex',
    '[class.ax-button]': 'true',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
  template: `
    <button
      type="button"
      [class]="classes()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-busy]="loading() ? 'true' : null"
      [attr.aria-disabled]="disabled() || loading() ? 'true' : null"
      [disabled]="disabled() || loading()"
      (click)="onClick($event)"
    >
      @if (loading()) {
        <span class="ax-button__spinner inline-flex shrink-0" aria-hidden="true">
          <svg class="animate-spin motion-reduce:animate-none" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </span>
      }
      <span
        class="ax-button__leading inline-flex shrink-0 items-center"
        [hidden]="!showLeading() || loading()"
      >
        <ng-content select="[axButtonLeading]"></ng-content>
      </span>
      <span class="ax-button__label inline-flex items-center gap-2">
        <ng-content></ng-content>
      </span>
      <span
        class="ax-button__trailing inline-flex shrink-0 items-center"
        [hidden]="!showTrailing()"
      >
        <ng-content select="[axButtonTrailing]"></ng-content>
      </span>
    </button>
  `,
})
export class AxButtonComponent {
  /** Visual style of the button. @default 'primary' */
  variant = input<ButtonVariant>('primary');

  /** Size of the button. Affects height, padding, and icon slot size. @default 'md' */
  size = input<ButtonSize>('md');

  /** Disabled state. When true, button is non-interactive and visually muted. @default false */
  disabled = input<boolean>(false);

  /**
   * Loading state — shows a spinner and disables click. When true, the
   * clickEvent is suppressed regardless of `disabled` state. @default false
   */
  loading = input<boolean>(false);

  /**
   * Force-show the leading icon slot. Prefer marking the icon with
   * `axButtonLeading` — that is auto-detected via content projection.
   * @default false
   */
  hasLeading = input<boolean>(false);

  /**
   * Force-show the trailing icon slot. Prefer marking the icon with
   * `axButtonTrailing` — that is auto-detected via content projection.
   * @default false
   */
  hasTrailing = input<boolean>(false);

  /** Accessible label override. Use when the button has no visible text (icon-only). */
  ariaLabel = input<string | null>(null);

  /** Emitted on click. Payload: native MouseEvent. Suppressed if disabled or loading. */
  readonly clickEvent = output<MouseEvent>();

  private readonly leadingSlot = contentChild(AxButtonLeadingDirective);
  private readonly trailingSlot = contentChild(AxButtonTrailingDirective);

  /** Leading slot visible when forced or when an `axButtonLeading` marker is projected. */
  protected readonly showLeading = computed(
    () => this.hasLeading() || !!this.leadingSlot(),
  );

  /** Trailing slot visible when forced or when an `axButtonTrailing` marker is projected. */
  protected readonly showTrailing = computed(
    () => this.hasTrailing() || !!this.trailingSlot(),
  );

  /** Resolved class string — composed via cn() and cva. */
  protected readonly classes = computed(() =>
    cn(buttonVariants({ variant: this.variant(), size: this.size() }))
  );

  protected onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clickEvent.emit(event);
  }
}
