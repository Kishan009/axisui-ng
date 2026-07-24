/**
 * Input — single-line text input. Canonical form-field pattern.
 *
 * Conventions:
 *   - Standalone, OnPush
 *   - Signal inputs (no @Input)
 *   - model() for two-way value binding (works with template-driven
 *     forms via [(ngModel)] and with reactive forms via
 *     [formControl] / formControlName)
 *   - ControlValueAccessor for ngModel / FormControl interop
 *   - cn() + cva
 *   - A11y: set `id` to match the parent FormField's `forId` so the
 *     `<label for>` associates with this input. Inside a FormField the
 *     `aria-describedby`/`aria-invalid` are auto-wired to the field's
 *     helper/error text (via AX_FORM_FIELD_CONTROL); the `describedBy` /
 *     `invalid` inputs override that and also work standalone.
 *   - SSR-safe: no window/document
 *
 * @example
 * <ax-input [(value)]="name" placeholder="Your name" />
 *
 * @example In a FormField
 * <ax-form-field label="Email" forId="email" helper="We'll never share it.">
 *   <ax-input id="email" type="email" [(value)]="email" />
 * </ax-form-field>
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
import { AX_FORM_FIELD_CONTROL, type AxFormFieldControl } from '../form-field/form-field-control';
import { inputVariants, type InputSize } from './input.variants';

@Component({
  selector: 'ax-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxInputComponent),
      multi: true,
    },
    {
      provide: AX_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => AxInputComponent),
    },
  ],
  host: {
    '[class.ax-input]': 'true',
    '[attr.data-size]': 'size()',
  },
  template: `
    <input
      [class]="classes()"
      [attr.id]="id()"
      [type]="type()"
      [attr.autocomplete]="autocomplete()"
      [attr.name]="name()"
      [value]="value() ?? ''"
      [placeholder]="placeholder()"
      [disabled]="effectiveDisabled()"
      [readonly]="readonlyState()"
      [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.aria-describedby]="effectiveDescribedBy()"
      [attr.aria-required]="required() ? 'true' : null"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
  `,
})
export class AxInputComponent implements ControlValueAccessor, AxFormFieldControl {
  /** Two-way value binding. */
  value = model<string | null>(null);

  /**
   * id of the inner `<input>`. Set this to match a `ax-form-field`'s
   * `forId` so the projected `<label for>` associates with the control.
   */
  id = input<string | null>(null);

  /**
   * Native input type. @default 'text'
   *
   * `date` / `time` / `datetime-local` use the browser's built-in pickers and
   * still bind as strings (ISO-ish). For a styled calendar overlay or segmented
   * time control, use Pro `ax-date-picker` / `ax-time-picker`. For files, use
   * `ax-upload` — `type="file"` is intentionally not supported here (value is
   * `File[]`, not `string`).
   */
  type = input<
    'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'
  >('text');

  /** Bounding-box size. @default 'md' */
  size = input<InputSize>('md');

  /** Placeholder text. */
  placeholder = input<string>('');

  /**
   * Native `autocomplete` hint (e.g. 'email', 'current-password', 'new-password',
   * 'name', 'one-time-code'). Critical for password managers and mobile keyboards.
   * @default null
   */
  autocomplete = input<string | null>(null);

  /** Native `name` attribute — helps password managers group and save fields. @default null */
  name = input<string | null>(null);

  /** Required for forms. @default false */
  required = input<boolean>(false);

  /** Read-only mode. @default false */
  readonly = input<boolean>(false);

  /** Disabled state. @default false */
  disabled = input<boolean>(false);

  /** Whether the field has a validation error. @default false */
  invalid = input<boolean>(false);

  /** id of the helper/error element (for aria-describedby). */
  describedBy = input<string | null>(null);

  /** aria-describedby pushed down by a parent FormField (auto-wiring). */
  private readonly fieldDescribedBy = signal<string | null>(null);

  /** invalid state pushed down by a parent FormField (auto-wiring). */
  private readonly fieldInvalid = signal<boolean>(false);

  /** Effective aria-describedby — an explicit `describedBy` input wins over field wiring. */
  protected readonly effectiveDescribedBy = computed<string | null>(
    () => this.describedBy() ?? this.fieldDescribedBy(),
  );

  /** Effective invalid — the `invalid` input OR the parent field's error state. */
  protected readonly effectiveInvalid = computed<boolean>(() => this.invalid() || this.fieldInvalid());

  /** Internal disabled state — set by CVA's setDisabledState. */
  protected readonly disabledState = signal<boolean>(false);

  /** Effective disabled state — the input OR the CVA-managed state. */
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());

  /** Internal readonly state — derived from the input + setDisabledState fallback. */
  protected readonly readonlyState = computed<boolean>(() => this.readonly() || this.disabledState());

  protected readonly classes = computed(() => cn(inputVariants({ size: this.size() })));

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  // --- ControlValueAccessor implementation ---
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
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

  // --- AxFormFieldControl (a11y wiring pushed down by a parent FormField) ---
  _setFieldDescribedBy(id: string | null): void {
    this.fieldDescribedBy.set(id);
  }

  _setFieldInvalid(invalid: boolean): void {
    this.fieldInvalid.set(invalid);
  }
}
