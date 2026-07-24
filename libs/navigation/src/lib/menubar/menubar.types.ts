import { InjectionToken, type Signal } from '@angular/core';

/** Coordinates one-open-at-a-time + roving across top-level menus. */
export interface MenubarContext {
  readonly openId: Signal<string | null>;
  setOpen(id: string | null): void;
  register(id: string): void;
  focusByOffset(fromId: string, offset: number): void;
}
export const MENUBAR_CONTEXT = new InjectionToken<MenubarContext>('AX_MENUBAR_CONTEXT');
