import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * InputOTP — one-time-code entry. A single hidden input handles paste/autofill;
 * visible cells mirror its value.
 *
 * @example <ax-input-otp [length]="6" [(value)]="code" (complete)="verify($event)" />
 */
@Component({
  selector: 'ax-input-otp',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AxInputOtpComponent),
      multi: true,
    },
  ],
  host: { class: 'relative inline-flex' },
  template: `
    <input
      type="text"
      inputmode="numeric"
      autocomplete="one-time-code"
      class="absolute inset-0 z-10 h-full w-full cursor-default opacity-0"
      [attr.maxlength]="length()"
      [attr.aria-label]="'One-time code, ' + length() + ' digits'"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [attr.aria-describedby]="describedBy()"
      [value]="value()"
      [disabled]="effectiveDisabled()"
      (input)="onInput($event)"
      (focus)="focused.set(true)"
      (blur)="focused.set(false); onTouched()"
    />
    <div class="flex items-center gap-2" aria-hidden="true">
      @for (cell of cells(); track $index) {
        @if (separator() !== null && $index === separator()) {
          <span class="text-muted-foreground">-</span>
        }
        <div
          class="ax-otp__cell flex h-10 w-10 items-center justify-center rounded-[var(--radius-field)] border border-input text-sm font-medium transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-out-quart"
          [class.border-ring]="!invalid() && $index === value().length"
          [class.border-destructive]="invalid()"
          [class.ring-2]="focused() && $index === value().length"
          [class.ring-ring]="focused() && $index === value().length"
        >
          {{ display(cell) }}
        </div>
      }
    </div>
  `,
})
export class AxInputOtpComponent implements ControlValueAccessor {
  /** Number of cells. @default 6 */
  length = input<number>(6);
  /** Insert a separator after this index. @default null */
  separator = input<number | null>(null);
  /** Mask digits with •. @default false */
  mask = input<boolean>(false);
  /** Current value (two-way). @default '' */
  value = model<string>('');
  /** Disabled state. @default false */
  disabled = input<boolean>(false);
  /** Validation-error state — cells turn destructive and the input is aria-invalid. @default false */
  invalid = input<boolean>(false);
  /** id of a helper/error element (aria-describedby), e.g. an "invalid code" message. @default null */
  describedBy = input<string | null>(null);
  /** Fires once all cells are filled. */
  readonly complete = output<string>();

  /** Whether the hidden input currently has focus — drives the active-cell focus ring. */
  protected readonly focused = signal<boolean>(false);

  /** Per-cell characters padded to `length`. */
  protected readonly cells = computed<string[]>(() => {
    const v = this.value();
    return Array.from({ length: this.length() }, (_, i) => v[i] ?? '');
  });

  /** Internal disabled state — set by CVA's setDisabledState. */
  protected readonly disabledState = signal<boolean>(false);
  /** Effective disabled state — the [disabled] input OR the CVA-managed state. */
  protected readonly effectiveDisabled = computed<boolean>(() => this.disabled() || this.disabledState());

  constructor() {
    effect(() => {
      const v = this.value();
      if (v.length === this.length() && v.length > 0) {
        this.complete.emit(v);
      }
    });
  }

  protected display(cell: string): string {
    if (!cell) return '';
    return this.mask() ? '•' : cell;
  }

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const digits = raw.replace(/\D/g, '').slice(0, this.length());
    this.value.set(digits);
    this.onChange(digits);
    // keep the hidden input's DOM value in sync after sanitising
    (event.target as HTMLInputElement).value = digits;
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
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
