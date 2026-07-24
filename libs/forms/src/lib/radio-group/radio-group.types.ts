import { InjectionToken, type Signal } from '@angular/core';

/**
 * Shared state a `ax-radio-group` exposes to the `ax-radio` children projected
 * inside it, so the group owns the selected value, the shared native `name`
 * (which is what makes the browser treat the radios as one keyboard-navigable
 * group), and the disabled state.
 */
export interface RadioGroupContext {
  /** The currently-selected value, or null when nothing is selected. */
  readonly value: Signal<string | null>;
  /** The shared native input `name` — identical across the group's radios. */
  readonly name: Signal<string>;
  /** Whether the whole group is disabled. */
  readonly disabled: Signal<boolean>;
  /** Called by a child radio when the user selects it. */
  select(value: string): void;
}

export const RADIO_GROUP = new InjectionToken<RadioGroupContext>('RADIO_GROUP');
