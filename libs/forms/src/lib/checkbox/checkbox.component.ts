/**
 * Checkbox — boolean toggle. Implements CVA + a native <input
 * type="checkbox"> under the hood for proper form submission.
 */

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

import { cn } from '../_utils/cn';

@Component({
  selector: 'ax-checkbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxCheckboxComponent),
      multi: true,
    },
  ],
  host: { '[class.ax-checkbox]': 'true' },
  template: `
    <label class="inline-flex items-center gap-2 cursor-pointer has-[:disabled]:cursor-not-allowed">
      <input
        type="checkbox"
        class="peer sr-only"
        [checked]="checked()"
        [indeterminate]="indeterminate()"
        [attr.aria-checked]="indeterminate() ? 'mixed' : (checked() ? 'true' : 'false')"
        [disabled]="effectiveDisabled()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="describedBy()"
        (change)="onChangeEvent($event)"
        (blur)="onBlur()"
      />
      <span
        [class]="boxClasses()"
        [attr.aria-hidden]="true"
        [attr.data-checked]="checked() || indeterminate()"
      >
        @if (indeterminate()) {
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        } @else if (checked()) {
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        }
      </span>
      <ng-content></ng-content>
    </label>
  `,
})
export class AxCheckboxComponent implements ControlValueAccessor {
  checked = model<boolean>(false);
  /**
   * Indeterminate ("mixed") state — e.g. a parent checkbox when only some
   * children are checked. Takes visual + `aria-checked="mixed"` precedence over
   * `checked`. The consumer owns clearing it (typically on the next user toggle).
   * @default false
   */
  indeterminate = input<boolean>(false);
  disabled = input<boolean>(false);
  ariaLabel = input<string | null>(null);
  describedBy = input<string | null>(null);

  protected readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());

  protected readonly boxClasses = computed(() =>
    cn(
      // Touch target (S3): visual box stays 16px; ::before expands pressable area to ≥44px.
      "relative inline-flex h-4 w-4 shrink-0 items-center justify-center before:absolute before:inset-[-14px] before:content-['']",
      'rounded-sm border border-input bg-background',
      'transition-[color,background-color,border-color,transform] duration-[var(--duration-fast)] ease-out-quart',
      'active:scale-[0.98]',
      'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      'data-[checked=true]:bg-primary data-[checked=true]:border-primary data-[checked=true]:text-primary-foreground'
    )
  );

  protected onChangeEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked.set(target.checked);
    this.onChange(target.checked);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: boolean | null): void {
    this.checked.set(Boolean(value));
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
