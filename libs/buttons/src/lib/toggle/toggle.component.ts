/**
 * Toggle — a two-state button (pressed / not pressed).
 *
 * Can be used standalone (a single toggle bound to a `pressed` model)
 * or as a child of ToggleGroup, where the group manages the value and
 * the roving tabindex.
 *
 * Conventions demonstrated:
 *   - Standalone, OnPush
 *   - Signal inputs/outputs + model() for the two-way pressed state
 *   - cva variants
 *   - cn() for class composition
 *   - A11y: aria-pressed on the inner <button>; the roving tabindex
 *     is managed by ToggleGroup via a signal input
 *
 * @example Standalone
 * <ax-toggle [(pressed)]="isMuted">Mute</ax-toggle>
 *
 * @example In a group
 * <ax-toggle-group type="single" [(value)]="align">
 *   <ax-toggle value="left">Left</ax-toggle>
 *   <ax-toggle value="center">Center</ax-toggle>
 *   <ax-toggle value="right">Right</ax-toggle>
 * </ax-toggle-group>
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';

import { cn } from '../_utils/cn';
import { toggleVariants, type ToggleSize, type ToggleVariant } from './toggle.variants';

@Component({
  selector: 'ax-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ax-toggle]': 'true',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-pressed]': 'pressed()',
  },
  template: `
    <button
      type="button"
      [class]="classes()"
      [attr.aria-pressed]="pressed()"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [attr.tabindex]="tabIndex()"
      [disabled]="disabled()"
      (click)="onClick($event)"
    >
      <span class="ax-toggle__leading inline-flex shrink-0 items-center" [hidden]="!hasLeading()">
        <ng-content select="[axButtonLeading]"></ng-content>
      </span>
      <span class="ax-toggle__label inline-flex items-center gap-2"><ng-content></ng-content></span>
      <span class="ax-toggle__trailing inline-flex shrink-0 items-center" [hidden]="!hasTrailing()">
        <ng-content select="[axButtonTrailing]"></ng-content>
      </span>
    </button>
  `,
})
export class AxToggleComponent {
  /** Visual style. @default 'default' */
  variant = input<ToggleVariant>('default');

  /** Size of the bounding box. @default 'md' */
  size = input<ToggleSize>('md');

  /** Disabled state. @default false */
  disabled = input<boolean>(false);

  /** Two-way bound pressed state. */
  pressed = model<boolean>(false);

  /** Optional value for use in a ToggleGroup. */
  value = input<string | null>(null);

  /** Whether a leading icon slot is present. */
  hasLeading = input<boolean>(false);

  /** Whether a trailing icon slot is present. */
  hasTrailing = input<boolean>(false);

  /** Accessible label override. */
  ariaLabel = input<string | null>(null);

  /**
   * Roving tabindex — managed by a parent ToggleGroup. The first child
   * has tabindex=0, the rest have -1, so screen readers and keyboard
   * users land on a single stop. Standalone toggles default to 0.
   *
   * Note: this is a writable signal, not an input, because the group
   * owns the active-index state and writes to the toggle directly.
   */
  readonly tabIndex = signal<number>(0);

  protected readonly classes = computed(() =>
    cn(toggleVariants({ variant: this.variant(), size: this.size() }))
  );

  protected onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.pressed.set(!this.pressed());
  }
}
