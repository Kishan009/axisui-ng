import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Slider — token-styled wrapper over native <input type="range">.
 *
 * Implements ControlValueAccessor, so it works with [(value)], [(ngModel)],
 * and reactive forms ([formControl] / formControlName).
 *
 * @example <ax-slider [(value)]="volume" [min]="0" [max]="100" ariaLabel="Volume" />
 */
@Component({
  selector: 'ax-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxSliderComponent),
      multi: true,
    },
  ],
  host: { class: 'block' },
  template: `
    <input
      type="range"
      class="ax-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--color-primary)] transition-[opacity] duration-[var(--duration-fast)] ease-out-quart disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [value]="value()"
      [disabled]="effectiveDisabled()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-valuetext]="valueText()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
})
export class AxSliderComponent implements ControlValueAccessor {
  /** Minimum value. @default 0 */
  min = input<number>(0);
  /** Maximum value. @default 100 */
  max = input<number>(100);
  /** Step increment. @default 1 */
  step = input<number>(1);
  /** Current value (two-way). @default 0 */
  value = model<number>(0);
  /** Disabled state. @default false */
  disabled = input<boolean>(false);
  /** Accessible label. @default '' */
  ariaLabel = input<string>('');
  /**
   * Optional formatter for the value announced to screen readers (aria-valuetext),
   * e.g. `v => '$' + v` or `v => v + '%'`. When unset, the raw number is announced.
   * @default null
   */
  format = input<((value: number) => string) | null>(null);

  /** Human-readable value for aria-valuetext, or null to fall back to aria-valuenow. */
  protected readonly valueText = computed<string | null>(() => {
    const fn = this.format();
    return fn ? fn(this.value()) : null;
  });

  /** Internal disabled state — set by CVA's setDisabledState. */
  protected readonly disabledState = signal<boolean>(false);
  /** Effective disabled state — the [disabled] input OR the CVA-managed state. */
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());

  protected onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).valueAsNumber;
    this.value.set(next);
    this.onChange(next);
  }

  // --- ControlValueAccessor ---
  private onChange: (value: number) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.value.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
