/**
 * RadioGroup — a mutually-exclusive set of `ax-radio` children.
 *
 * The group owns the selected value and hands every child a shared native `name`,
 * so the browser treats them as one radio group: arrow keys move and select,
 * roving tab order is automatic, and ARIA is native. The group is the
 * ControlValueAccessor (bind `[(ngModel)]` / `formControlName` here, not on each
 * radio) and exposes `role="radiogroup"`.
 *
 * @example
 * <ax-radio-group [(value)]="plan" ariaLabel="Plan">
 *   <ax-radio value="free">Free</ax-radio>
 *   <ax-radio value="pro">Pro</ax-radio>
 * </ax-radio-group>
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

import { RADIO_GROUP, type RadioGroupContext } from './radio-group.types';

let radioGroupUid = 0;

@Component({
  selector: 'ax-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AxRadioGroupComponent), multi: true },
    { provide: RADIO_GROUP, useExisting: forwardRef(() => AxRadioGroupComponent) },
  ],
  host: {
    role: 'radiogroup',
    class: 'flex flex-col gap-2',
    '[attr.aria-label]': 'ariaLabel() || null',
    '[attr.aria-orientation]': "orientation()",
    '[attr.data-disabled]': "disabled() ? 'true' : null",
  },
  template: `<ng-content />`,
})
export class AxRadioGroupComponent implements RadioGroupContext, ControlValueAccessor {
  /** Selected value (two-way). @default null */
  readonly value = model<string | null>(null);

  /** Shared native input name; a unique one is generated when unset. */
  readonly name = input<string>(`ax-radio-group-${++radioGroupUid}`);

  /** Disable the whole group. @default false */
  // eslint-disable-next-line @angular-eslint/no-input-rename -- aliased to `disabled` so the public API reads naturally while the internal name avoids colliding with the `disabled` context getter
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /** Accessible label for the group. @default '' */
  readonly ariaLabel = input<string>('');

  /** Layout hint exposed as aria-orientation. @default 'vertical' */
  readonly orientation = input<'vertical' | 'horizontal'>('vertical');

  /** Disabled state pushed down by a parent form via setDisabledState. */
  private readonly disabledState = signal<boolean>(false);

  /** Effective disabled — the `disabled` input OR the CVA-managed state. */
  readonly disabled = computed<boolean>(() => this.disabledInput() || this.disabledState());

  /** Called by a child radio when the user selects it. */
  select(next: string): void {
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  // --- ControlValueAccessor ---
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : null);
  }
  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
