/**
 * FormField — the wrapper that provides a label, helper text, and
 * error message around a form control. It does NOT wrap the input
 * itself; it renders the label/helper/error chrome and the consumer
 * puts the input in via content projection.
 *
 * The label's `for` comes from `forId`; associate it by setting the
 * projected control's `id` to the same value. Helper and error get their
 * own ids, and the field auto-wires `aria-describedby` (plus `aria-invalid`
 * on error) onto the projected control through the `AX_FORM_FIELD_CONTROL`
 * contract — see form-field-control.ts.
 *
 * @example
 * <ax-form-field label="Email" forId="email" helper="We'll never share it.">
 *   <ax-input id="email" type="email" [(value)]="email" />
 * </ax-form-field>
 *
 * @example With error
 * <ax-form-field label="Password" forId="password" error="At least 8 characters">
 *   <ax-input id="password" type="password" [(value)]="password" />
 * </ax-form-field>
 *
 * @example Group mode (radios/checkboxes) — renders a labelled role="group"
 * with no `<label for>`, and puts aria-describedby/aria-invalid on the group.
 * <ax-form-field [group]="true" groupRole="radiogroup" label="Plan" error="Pick one">
 *   <ax-radio name="plan" value="free">Free</ax-radio>
 *   <ax-radio name="plan" value="pro">Pro</ax-radio>
 * </ax-form-field>
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  input,
} from '@angular/core';

import { cn } from '../_utils/cn';
import { AX_FORM_FIELD_CONTROL } from './form-field-control';

let formFieldUid = 0;

@Component({
  selector: 'ax-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ax-form-field]': 'true',
    '[class.ax-form-field--invalid]': 'hasError()',
    '[attr.role]': 'group() ? groupRole() : null',
    '[attr.aria-labelledby]': 'group() && label() ? labelId : null',
    '[attr.aria-describedby]': 'group() ? describedById() : null',
    '[attr.aria-invalid]': "group() && hasError() ? 'true' : null",
    '[attr.aria-required]': "group() && required() ? 'true' : null",
  },
  template: `
    @if (label()) {
      @if (group()) {
        <span [id]="labelId" class="block text-sm font-medium text-foreground mb-1">
          {{ label() }}
          @if (required()) {
            <span class="text-destructive ms-1" aria-hidden="true">*</span>
          }
        </span>
      } @else {
        <label [attr.for]="forId()" class="block text-sm font-medium text-foreground mb-1">
          {{ label() }}
          @if (required()) {
            <span class="text-destructive ms-1" aria-hidden="true">*</span>
          }
        </label>
      }
    }
    <ng-content></ng-content>
    @if (helper() && !hasError()) {
      <p [id]="helperId" class="mt-1 text-xs text-muted-foreground">{{ helper() }}</p>
    }
    @if (error() && hasError()) {
      <p [id]="errorId" class="mt-1 text-xs text-destructive" role="alert">{{ error() }}</p>
    }
  `,
})
export class AxFormFieldComponent {
  /** Visible label. */
  label = input<string | null>(null);

  /** Helper text shown when there's no error. */
  helper = input<string | null>(null);

  /** Error message shown when `error` is non-null. */
  error = input<string | null>(null);

  /** Whether the field is required (visual asterisk + aria). */
  required = input<boolean>(false);

  /** The id of the projected input. Used to wire the <label for="...">. */
  forId = input<string | null>(null);

  /**
   * Group mode — for a set of related controls (radios, checkboxes) rather
   * than a single labelable input. The host becomes a labelled `role` group
   * (via `aria-labelledby`), the label renders as a `<span>` (not `<label
   * for>`, which is invalid for a group), and `aria-describedby` /
   * `aria-invalid` / `aria-required` apply to the group, not one control.
   */
  group = input<boolean>(false);

  /** The group's ARIA role when `group` is set. @default 'group' */
  groupRole = input<'group' | 'radiogroup'>('group');

  private readonly uid = ++formFieldUid;
  protected readonly labelId = `ax-form-field-label-${this.uid}`;
  protected readonly helperId = `ax-form-field-helper-${this.uid}`;
  protected readonly errorId = `ax-form-field-error-${this.uid}`;
  protected readonly hasError = computed(() => this.error() != null && this.error() !== '');

  /** The projected control (ax-input, etc.) that opts into a11y auto-wiring. */
  private readonly control = contentChild(AX_FORM_FIELD_CONTROL, { descendants: true });

  /** id of the active descriptor — the error wins over the helper, else none. */
  protected readonly describedById = computed<string | null>(() =>
    this.hasError() ? this.errorId : this.helper() ? this.helperId : null,
  );

  constructor() {
    // Push the active descriptor id + error state onto the projected control.
    // Done via the AX_FORM_FIELD_CONTROL contract because a content-projected
    // control cannot inject this field directly. In group mode the description
    // belongs on the group (see host bindings) and the children self-label,
    // so we skip the single-control wiring.
    effect(() => {
      if (this.group()) return;
      const control = this.control();
      if (!control) return;
      control._setFieldDescribedBy(this.describedById());
      control._setFieldInvalid(this.hasError());
    });
  }

  protected readonly _ = cn; // satisfy unused-import lint
}
