import { InjectionToken, type Signal } from '@angular/core';

export interface NavMenuContext {
  readonly openValue: Signal<string | null>;
  setOpen(value: string | null): void;
  /** The value of the currently-hovered/focused item, or null. */
  readonly hoveredValue: Signal<string | null>;
  setHovered(value: string | null): void;
}
export const NAV_MENU_CONTEXT = new InjectionToken<NavMenuContext>('AX_NAV_MENU_CONTEXT');
