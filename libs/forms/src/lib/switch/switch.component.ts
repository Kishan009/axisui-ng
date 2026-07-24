/**
 * Switch — boolean toggle styled as a sliding pill. Semantically a
 * checkbox; use Switch for "this feature is on/off" and Checkbox
 * for "yes/no I agree" style options.
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
  selector: 'ax-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxSwitchComponent),
      multi: true,
    },
  ],
  host: { '[class.ax-switch]': 'true' },
  template: `
    <label class="inline-flex items-center gap-2 cursor-pointer has-[:disabled]:cursor-not-allowed">
      <input
        type="checkbox"
        role="switch"
        class="peer sr-only"
        [checked]="checked()"
        [attr.aria-checked]="checked()"
        [disabled]="effectiveDisabled()"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-describedby]="describedBy()"
        (change)="onChangeEvent($event)"
        (blur)="onBlur()"
      />
      <span
        [class]="trackClasses()"
        [attr.data-checked]="checked()"
        [attr.aria-hidden]="true"
      >
        <span
          [class]="thumbClasses()"
          [attr.data-checked]="checked()"
        ></span>
      </span>
      <ng-content></ng-content>
    </label>
  `,
})
export class AxSwitchComponent implements ControlValueAccessor {
  checked = model<boolean>(false);
  disabled = input<boolean>(false);
  ariaLabel = input<string | null>(null);
  describedBy = input<string | null>(null);

  protected readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());

  protected readonly trackClasses = computed(() =>
    cn(
      // Touch target (S3): track is 20×36; ::before expands pressable area toward ≥44px.
      "relative inline-flex h-5 w-9 items-center rounded-full before:absolute before:inset-y-[-12px] before:inset-x-[-4px] before:content-['']",
      'bg-input transition-[background-color,transform] duration-[var(--duration-fast)] ease-out-quart',
      'active:scale-[0.98]',
      'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      'data-[checked=true]:bg-primary'
    )
  );

  protected readonly thumbClasses = computed(() =>
    cn(
      'absolute inline-block h-4 w-4 rounded-full bg-background shadow-sm',
      'transition-transform duration-[var(--duration)] ease-out-expo',
      'start-0.5',
      'data-[checked=true]:translate-x-4'
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
