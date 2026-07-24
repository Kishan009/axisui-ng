/**
 * Textarea — multi-line text input. Same CVA contract as Input.
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
import { inputVariants, type InputSize } from '../input/input.variants';

@Component({
  selector: 'ax-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxTextareaComponent),
      multi: true,
    },
    {
      provide: AX_FORM_FIELD_CONTROL,
      useExisting: forwardRef(() => AxTextareaComponent),
    },
  ],
  host: {
    '[class.ax-textarea]': 'true',
    '[attr.data-size]': 'size()',
  },
  template: `
    <textarea
      [class]="classes()"
      [attr.id]="id()"
      [rows]="rows()"
      [value]="value() ?? ''"
      [placeholder]="placeholder()"
      [disabled]="effectiveDisabled()"
      [readonly]="readonlyState()"
      [attr.aria-invalid]="effectiveInvalid() ? 'true' : null"
      [attr.aria-describedby]="effectiveDescribedBy()"
      [attr.aria-required]="required() ? 'true' : null"
      (input)="onInput($event)"
      (blur)="onBlur()"
    ></textarea>
  `,
})
export class AxTextareaComponent implements ControlValueAccessor, AxFormFieldControl {
  value = model<string | null>(null);

  /** id of the inner `<textarea>`. Set to match a `ax-form-field`'s `forId`. */
  id = input<string | null>(null);

  size = input<InputSize>('md');
  rows = input<number>(4);
  placeholder = input<string>('');
  required = input<boolean>(false);
  readonly = input<boolean>(false);
  disabled = input<boolean>(false);
  invalid = input<boolean>(false);
  describedBy = input<string | null>(null);

  /** aria state pushed down by a parent FormField (auto-wiring). */
  private readonly fieldDescribedBy = signal<string | null>(null);
  private readonly fieldInvalid = signal<boolean>(false);

  /** Effective aria — an explicit `describedBy`/`invalid` input wins over field wiring. */
  protected readonly effectiveDescribedBy = computed<string | null>(
    () => this.describedBy() ?? this.fieldDescribedBy(),
  );
  protected readonly effectiveInvalid = computed<boolean>(() => this.invalid() || this.fieldInvalid());

  protected readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());
  protected readonly readonlyState = computed<boolean>(() => this.readonly() || this.disabledState());

  protected readonly classes = computed(() => cn(inputVariants({ size: this.size() }), 'h-auto py-2'));

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value.set(target.value);
    this.onChange(target.value);
  }

  protected onBlur(): void {
    this.onTouched();
  }

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
