/**
 * Radio — single value from a set. Wrap several in a `ax-radio-group` for the full
 * WAI-ARIA radiogroup experience (arrow-key selection, roving tab order, a
 * group-level ControlValueAccessor). Inside a group the radio derives its `name`,
 * checked, and disabled state from the group. Standalone (no group) it still works
 * via a shared `name` + [checked] / (changed).
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { cn } from '../_utils/cn';
import { RADIO_GROUP } from '../radio-group/radio-group.types';

let radioUid = 0;

@Component({
  selector: 'ax-radio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxRadioComponent),
      multi: true,
    },
  ],
  host: { '[class.ax-radio]': 'true' },
  template: `
    <label class="inline-flex items-center gap-2 cursor-pointer has-[:disabled]:cursor-not-allowed">
      <input
        type="radio"
        [name]="resolvedName()"
        [value]="value()"
        [checked]="resolvedChecked()"
        [disabled]="resolvedDisabled()"
        [attr.aria-label]="ariaLabel()"
        (change)="onChangeEvent($event)"
        (blur)="onBlur()"
        class="peer sr-only"
      />
      <span
        [class]="dotClasses()"
        [attr.data-checked]="resolvedChecked()"
        [attr.aria-hidden]="true"
      >
        @if (resolvedChecked()) {
          <span class="h-2 w-2 rounded-full bg-primary"></span>
        }
      </span>
      <ng-content></ng-content>
    </label>
  `,
})
export class AxRadioComponent implements ControlValueAccessor {
  /** Group name. Multiple Radios with the same name are mutually exclusive. */
  name = input<string>(`ax-radio-${++radioUid}`);

  /** The value emitted when this radio is selected. */
  value = input.required<string>();

  checked = input<boolean>(false);
  disabled = input<boolean>(false);
  ariaLabel = input<string | null>(null);

  readonly changed = output<string>();

  /** The enclosing radio group, if any — supplies name/value/disabled. */
  private readonly group = inject(RADIO_GROUP, { optional: true });

  protected readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());
  protected readonly checkedState = signal<boolean>(false);

  /** In a group the shared group name wins (that's what makes the native group). */
  protected readonly resolvedName = computed(() => this.group?.name() ?? this.name());

  /** Checked = the group's value matches, or (standalone) the input/CVA state. */
  protected readonly resolvedChecked = computed(() =>
    this.group ? this.group.value() === this.value() : this.checked() || this.checkedState(),
  );

  /** Disabled if the group is disabled or this radio is. */
  protected readonly resolvedDisabled = computed(() => (this.group?.disabled() ?? false) || this.effectiveDisabled());

  protected readonly dotClasses = computed(() =>
    cn(
      // Touch target (S3): visual radio stays 16px; ::before expands pressable area to ≥44px.
      "relative inline-flex h-4 w-4 items-center justify-center before:absolute before:inset-[-14px] before:content-['']",
      'rounded-full border border-input bg-background',
      'transition-[border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-out-quart',
      'active:scale-[0.98]',
      'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
      'data-[checked=true]:border-primary'
    )
  );

  protected onChangeEvent(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.checked) return;
    this.changed.emit(this.value());
    if (this.group) {
      // The group owns the model + CVA; let it update (also covers native
      // arrow-key selection, which fires `change` on the newly-checked radio).
      this.group.select(this.value());
    } else {
      this.onChange(this.value());
    }
  }

  protected onBlur(): void {
    this.onTouched();
  }

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.checkedState.set(value === this.value());
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
