/**
 * InputNumber — numeric field with side −/+ steppers, min/max/step/precision,
 * optional prefix/suffix, and ControlValueAccessor over `number | null`.
 *
 * Typing updates the value but does not rewrite the field mid-edit (no caret
 * jump); blur clamps + rounds + reflects the formatted value back. The −/+
 * buttons and ↑/↓ arrow keys step (with hold-to-repeat on press).
 *
 * @example
 * <ax-input-number [(value)]="qty" [min]="0" [max]="99" prefix="$" ariaLabel="Quantity" />
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AxIconComponent } from '@axisui-ng/icons';

import { cn } from '../_utils/cn';
import { inputVariants, type InputSize } from '../input/input.variants';

@Component({
  selector: 'ax-input-number',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxInputNumberComponent), multi: true },
  ],
  host: { class: 'block', '[attr.data-size]': 'size()' },
  template: `
    <div [class]="wrapperClasses()" [attr.aria-invalid]="invalid() ? 'true' : null">
      <button
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="flex h-full min-w-11 cursor-pointer items-center justify-center px-2 text-muted-foreground transition-[color,transform] duration-[var(--duration-fast)] ease-out-quart hover:text-foreground active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
        [disabled]="!canDecrement()"
        (pointerdown)="onPress(-1, $event)"
        (pointerup)="onRelease()"
        (pointerleave)="onRelease()"
      >
        <ax-icon name="minus" [size]="16" />
      </button>

      @if (prefix()) {
        <span class="ps-1 text-sm text-muted-foreground">{{ prefix() }}</span>
      }
      <input
        class="min-w-0 flex-1 border-0 bg-transparent px-2 text-center text-inherit outline-none focus:outline-none disabled:cursor-not-allowed"
        inputmode="decimal"
        role="spinbutton"
        [value]="displayValue()"
        [placeholder]="placeholder()"
        [disabled]="effectiveDisabled()"
        [readonly]="readonlyState()"
        [attr.aria-label]="ariaLabel() || null"
        [attr.aria-valuenow]="value()"
        [attr.aria-valuemin]="min()"
        [attr.aria-valuemax]="max()"
        [attr.aria-describedby]="describedBy()"
        (input)="onInput($event)"
        (keydown)="onKeydown($event)"
        (blur)="onBlur()"
      />
      @if (suffix()) {
        <span class="pe-1 text-sm text-muted-foreground">{{ suffix() }}</span>
      }

      <button
        type="button"
        tabindex="-1"
        aria-hidden="true"
        class="flex h-full min-w-11 cursor-pointer items-center justify-center px-2 text-muted-foreground transition-[color,transform] duration-[var(--duration-fast)] ease-out-quart hover:text-foreground active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40"
        [disabled]="!canIncrement()"
        (pointerdown)="onPress(1, $event)"
        (pointerup)="onRelease()"
        (pointerleave)="onRelease()"
      >
        <ax-icon name="plus" [size]="16" />
      </button>
    </div>
  `,
})
export class AxInputNumberComponent implements ControlValueAccessor {
  /** Two-way value. @default null */
  value = model<number | null>(null);

  /** Minimum (null = unbounded). @default null */
  min = input<number | null>(null);
  /** Maximum (null = unbounded). @default null */
  max = input<number | null>(null);
  /** Step increment. @default 1 */
  step = input<number>(1);
  /** Decimal places to round to (null = none). @default null */
  precision = input<number | null>(null);
  /** Text shown before the number (e.g. "$"). @default '' */
  prefix = input<string>('');
  /** Text shown after the number (e.g. "%"). @default '' */
  suffix = input<string>('');
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

  /** What the field shows — synced from the value except while actively typing. */
  protected readonly displayValue = signal<string>('');
  /** True between an `input` event and blur, so the sync effect won't rewrite mid-type. */
  private readonly typing = signal<boolean>(false);
  private readonly disabledState = signal<boolean>(false);
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.disabledState());
  protected readonly readonlyState = computed(() => this.readonly());

  protected readonly wrapperClasses = computed(() =>
    cn(
      inputVariants({ size: this.size() }),
      'flex items-center overflow-hidden px-0',
      'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      this.effectiveDisabled() && 'cursor-not-allowed opacity-50'
    )
  );

  protected readonly canDecrement = computed(() => {
    if (this.effectiveDisabled() || this.readonlyState()) return false;
    const min = this.min();
    return min == null || (this.value() ?? min) > min;
  });

  protected readonly canIncrement = computed(() => {
    if (this.effectiveDisabled() || this.readonlyState()) return false;
    const max = this.max();
    return max == null || (this.value() ?? max) < max;
  });

  private repeatTimer: ReturnType<typeof setTimeout> | null = null;
  private repeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.onRelease());
    // Reflect external value changes (binding / writeValue / step) into the field,
    // but never while the user is actively typing (avoids caret jumps).
    effect(() => {
      const v = this.value();
      if (!this.typing()) this.displayValue.set(v == null ? '' : String(v));
    });
  }

  protected onPress(dir: 1 | -1, event: Event): void {
    event.preventDefault(); // keep focus on the input
    if (this.effectiveDisabled() || this.readonlyState()) return;
    this.stepBy(dir);
    this.repeatTimer = setTimeout(() => {
      this.repeatInterval = setInterval(() => this.stepBy(dir), 80);
    }, 400);
  }

  protected onRelease(): void {
    if (this.repeatTimer != null) clearTimeout(this.repeatTimer);
    if (this.repeatInterval != null) clearInterval(this.repeatInterval);
    this.repeatTimer = null;
    this.repeatInterval = null;
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.effectiveDisabled() || this.readonlyState()) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.stepBy(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.stepBy(-1);
    }
  }

  private stepBy(dir: 1 | -1): void {
    const base = this.value() ?? this.min() ?? 0;
    this.commit(this.normalize(base + dir * this.step()));
  }

  protected onInput(event: Event): void {
    this.typing.set(true);
    const text = (event.target as HTMLInputElement).value.trim();
    if (text === '') {
      this.value.set(null);
      this.onChange(null);
      return;
    }
    const n = Number(text);
    if (!Number.isNaN(n)) {
      this.value.set(n); // not clamped/rounded mid-type, no display rewrite
      this.onChange(n);
    }
  }

  protected onBlur(): void {
    this.typing.set(false);
    const cur = this.value();
    if (cur == null) this.displayValue.set('');
    else this.commit(this.normalize(cur));
    this.onTouched();
  }

  private normalize(n: number): number {
    const min = this.min();
    const max = this.max();
    let v = n;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    const p = this.precision();
    return p != null ? Number(v.toFixed(p)) : v;
  }

  private commit(n: number): void {
    this.value.set(n);
    this.displayValue.set(String(n));
    this.onChange(n);
  }

  // --- ControlValueAccessor ---
  private onChange: (value: number | null) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    const n = typeof value === 'number' && Number.isFinite(value) ? value : null;
    this.value.set(n);
    this.displayValue.set(n == null ? '' : String(n));
  }
  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
