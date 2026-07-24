import { InjectionToken, type Signal } from '@angular/core';

/** Orientation of the stepper rail. */
export type StepperOrientation = 'horizontal' | 'vertical';

/** Direction of a requested transition. */
export type StepDirection = 'next' | 'previous' | 'jump';

/** Derived visual/logical state of a single step. */
export type StepState = 'upcoming' | 'active' | 'completed' | 'disabled' | 'error';

/** A pending or attempted transition, passed to the optional guard. */
export interface StepChange {
  /** Index moved from. */
  readonly from: number;
  /** Index requested to move to. */
  readonly to: number;
  /** How the move was triggered. */
  readonly direction: StepDirection;
}

/**
 * Optional transition guard. Return (or resolve) `false` to cancel the change.
 * A `Promise` puts the stepper into its `pending` state while it settles.
 */
export type StepperGuard = (change: StepChange) => boolean | Promise<boolean>;

/**
 * Shared context a `ax-stepper` provides to its `ax-step` children. Steps read
 * their derived state from it and funnel every transition through `request()`,
 * so linear rules + the optional guard are enforced on one path.
 */
export interface StepperContext {
  /** The active step index (0-based). */
  readonly currentStep: Signal<number>;
  /** Rail orientation. */
  readonly orientation: Signal<StepperOrientation>;
  /** Whether linear gating is enforced. */
  readonly linear: Signal<boolean>;
  /** True while an async guard is settling (no further transitions accepted). */
  readonly pending: Signal<boolean>;
  /** Total number of registered steps. */
  readonly count: Signal<number>;
  /** Request a transition to `to`; honours linear rules + the guard. */
  request(to: number, direction: StepDirection): void;
}

export const STEPPER_CONTEXT = new InjectionToken<StepperContext>('STEPPER_CONTEXT');
