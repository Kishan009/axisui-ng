import { InjectionToken, type Signal } from '@angular/core';

export type AccordionType = 'single' | 'multiple';

/** Contract the parent exposes to its items via DI. */
export interface AccordionContext {
  readonly type: Signal<AccordionType>;
  readonly openValues: Signal<readonly string[]>;
  toggle(value: string): void;
}

export const ACCORDION_CONTEXT = new InjectionToken<AccordionContext>('ACCORDION_CONTEXT');
