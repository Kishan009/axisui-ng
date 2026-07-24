/**
 * InputMask — a text field that formats input against a `mask`, storing the
 * masked text as its value (ControlValueAccessor over `string`).
 *
 * Tokens: `9` = digit, `A` = letter, `*` = alphanumeric; any other character is
 * a literal. See the pure `applyMask` engine in `input-mask.core`.
 *
 * @example <ax-input-mask mask="(999) 999-9999" [(value)]="phone" ariaLabel="Phone" />
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
import { inputVariants, type InputSize } from '../input/input.variants';
import { applyMask } from './input-mask.core';

@Component({
  selector: 'ax-input-mask',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxInputMaskComponent), multi: true },
  ],
  host: { class: 'block', '[attr.data-size]': 'size()' },
  template: `
    <input
      [class]="classes()"
      [value]="displayValue()"
      [placeholder]="placeholder()"
      [disabled]="effectiveDisabled()"
      [readonly]="readonly()"
      [attr.aria-label]="ariaLabel() || null"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      (input)="onInput($event)"
      (blur)="onTouched()"
    />
  `,
})
export class AxInputMaskComponent implements ControlValueAccessor {
  /** Mask pattern, e.g. "(999) 999-9999". @default '' (no masking) */
  mask = input<string>('');
  /** Two-way value — the masked text. @default null */
  value = model<string | null>(null);
  /** Placeholder. @default '' */
  placeholder = input<string>('');
  /** Field size. @default 'md' */
  size = input<InputSize>('md');
  /** Disabled (also driven by the parent form). @default false */
  disabled = input<boolean>(false);
  /** Read-only. @default false */
  readonly = input<boolean>(false);
  /** Validation-error styling. @default false */
  invalid = input<boolean>(false);
  /** id of a helper/error element. @default null */
  describedBy = input<string | null>(null);
  /** Accessible label. @default '' */
  ariaLabel = input<string>('');

  protected readonly displayValue = signal<string>('');
  private readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.disabledState());

  protected readonly classes = computed(() => cn(inputVariants({ size: this.size() })));

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const rawCaret = target.selectionStart ?? target.value.length;
    // Masking the text BEFORE the caret gives the masked prefix; its length is
    // where the caret belongs — so mid-string edits and backspace no longer jump
    // the caret to the end.
    const caret = applyMask(target.value.slice(0, rawCaret), this.mask()).length;
    const masked = applyMask(target.value, this.mask());
    target.value = masked;
    target.setSelectionRange(caret, caret);
    this.displayValue.set(masked);
    this.value.set(masked);
    this.onChange(masked);
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    const masked = applyMask(typeof value === 'string' ? value : '', this.mask());
    this.displayValue.set(masked);
    this.value.set(masked);
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
