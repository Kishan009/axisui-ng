import { InjectionToken, type Signal } from '@angular/core';

export interface TabsContext {
  readonly value: Signal<string | null>;
  select(value: string): void;
  /** Stable id for a trigger, so its panel can reference it (aria-labelledby). */
  tabId(value: string): string;
  /** Stable id for a panel, so its trigger can reference it (aria-controls). */
  panelId(value: string): string;
}

export const TABS_CONTEXT = new InjectionToken<TabsContext>('TABS_CONTEXT');
