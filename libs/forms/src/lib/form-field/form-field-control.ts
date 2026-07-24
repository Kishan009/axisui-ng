import { InjectionToken } from '@angular/core';

/**
 * Contract a form control implements so a parent `ax-form-field` can wire
 * a11y onto it across content projection (where the control cannot inject
 * the field directly). The field queries this token via `contentChild` and
 * pushes the active descriptor id + error state down to the control.
 *
 * Internal to `@axisui-ng/forms` — the underscore-prefixed members are not part
 * of the public component API.
 */
export interface AxFormFieldControl {
  /** Point the control's `aria-describedby` at the field's helper/error text (or clear it). */
  _setFieldDescribedBy(id: string | null): void;

  /** Reflect the field's error state onto the control's `aria-invalid`. */
  _setFieldInvalid(invalid: boolean): void;
}

/** DI token a control provides (`useExisting`) to opt into FormField a11y auto-wiring. */
export const AX_FORM_FIELD_CONTROL = new InjectionToken<AxFormFieldControl>('AX_FORM_FIELD_CONTROL');
