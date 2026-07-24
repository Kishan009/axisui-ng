import { InjectionToken, type Signal } from '@angular/core';

/** Contract the collapsible exposes to its trigger via DI. */
export interface CollapsibleContext {
  readonly open: Signal<boolean>;
  readonly contentId: string;
  toggle(): void;
}

export const COLLAPSIBLE_CTX = new InjectionToken<CollapsibleContext>('COLLAPSIBLE_CTX');
