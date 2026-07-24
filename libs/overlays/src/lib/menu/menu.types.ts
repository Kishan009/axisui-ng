import { InjectionToken, type Signal, TemplateRef } from '@angular/core';

/** Configuration for a menu subitem within a submenu. */
export interface MenuSubitemConfig {
  readonly label: string;
  readonly icon?: TemplateRef<void>;
  readonly disabled?: boolean;
}

/** Public inputs for AxMenuItemComponent. */
export interface MenuItemInputs {
  readonly disabled?: boolean;
  readonly submenu?: TemplateRef<MenuSubitemConfig>;
}

/**
 * The shape every keyboard-navigable menu item exposes so the menu's roving
 * FocusKeyManager can drive all three item kinds (item / checkbox / radio) as one
 * group. Satisfies CDK's FocusableOption + Highlightable, plus label/disabled for
 * type-ahead and skipping.
 */
export interface MenuNavigableItem {
  focus(): void;
  getHostElement(): HTMLElement;
  getLabel(): string;
  readonly disabled: boolean;
  setActiveStyles(): void;
  setInactiveStyles(): void;
}

/** Radio group context provided to radio items. */
export interface MenuRadioContext {
  readonly value: Signal<string | null>;
  select(value: string): void;
}
export const MENU_RADIO_CONTEXT = new InjectionToken<MenuRadioContext>('AX_MENU_RADIO_CONTEXT');

/** Menu context: lets items request the menu close after activation. */
export interface MenuContext {
  close(): void;
  /**
   * Notify the menu that the given item host element has gained focus, so the
   * menu can keep its active-item tracking in sync (used for submenu opening).
   * Optional so non-menu contexts can implement only `close`.
   */
  setActiveElement?(element: HTMLElement): void;
  /**
   * Open the submenu for the item whose host is `host` (no-op when that item
   * has no `[submenu]`). Optional — only dropdown menus with nested submenu
   * support implement this.
   */
  openSubmenu?(host: HTMLElement): void;
  /** Close any open child submenu of this menu. */
  closeChildSubmenu?(): void;
}
export const MENU_CONTEXT = new InjectionToken<MenuContext>('AX_MENU_CONTEXT');

/**
 * Presence marker provided (via the submenu TemplatePortal's injector) when a
 * `<ax-dropdown-menu>` is rendered as a submenu. Only its presence is read
 * (`isSubmenu`): it tells that menu to render its panel inline, since a submenu
 * has no trigger of its own. The injected value is not consumed.
 */
export const MENU_SUBMENU_PARENT = new InjectionToken<MenuContext>('AX_MENU_SUBMENU_PARENT');
