import { Highlightable } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import { cn } from '@axisui-ng/overlays-core';
import { MENU_CONTEXT, type MenuSubitemConfig } from './menu.types';

const ITEM_BASE =
  'flex w-full cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm outline-none ' +
  'transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98] ' +
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';

let _id = 0;
function nextId(): number {
  return _id++;
}

/** A standard menu action item. */
@Component({
  selector: 'ax-menu-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: {
    role: 'menuitem',
    tabindex: '-1',
    '[id]': 'id',
    '[attr.aria-disabled]': 'disabledInput() ? "true" : null',
    '[attr.aria-haspopup]': 'submenu() ? "menu" : null',
    '[class]': 'classes()',
    '(click)': 'activate()',
    '(focus)': 'onFocus()',
    '(mouseenter)': 'onPointerEnter()',
  },
  template: `
    <span class="min-w-0 flex-1 truncate"><ng-content /></span>
    @if (submenu()) {
      <ax-icon name="chevron-right" [size]="16" class="ms-auto shrink-0 text-muted-foreground" aria-hidden="true" />
    }
  `,
})
export class AxMenuItemComponent implements Highlightable {
  /** Stable unique id, referenced by the menu's aria-activedescendant. */
  readonly id = `ax-menu-item-${nextId()}`;

  /** Disable the item. @default false */
  // eslint-disable-next-line @angular-eslint/no-input-rename -- aliased to `disabled` so the template input coexists with the Highlightable `disabled` getter below
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
  /** Template for submenu content with MenuSubitemConfig context. */
  readonly submenu = input<TemplateRef<MenuSubitemConfig> | undefined>(undefined);
  /** Emitted when the item is activated (click or Enter). */
  // eslint-disable-next-line @angular-eslint/no-output-native -- `select` is the established public menu-item API
  readonly select = output<void>();

  private readonly menu = inject(MENU_CONTEXT);
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Highlightable.disabled — read (as a property) by the CDK key manager to skip this item. */
  get disabled(): boolean {
    return this.disabledInput();
  }

  protected readonly classes = computed(() =>
    cn(
      ITEM_BASE,
      // Roving focus highlights the active item via :focus (clobber-proof, unlike a
      // class toggled imperatively over the [class] host binding).
      'hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent focus:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50',
    ),
  );

  /**
   * Activate the item. Items with a `[submenu]` open that submenu (design: click
   * opens submenu, does not select). Leaf items emit `select` and close the menu.
   */
  activate(): void {
    if (this.disabledInput()) return;
    this.select.emit();
    if (this.submenu()) {
      this.menu.openSubmenu?.(this.host.nativeElement);
    } else {
      this.menu.close();
    }
  }

  // Highlightable (CDK ListKeyManager)
  setActiveStyles(): void {
    this.host.nativeElement.classList.add('bg-accent', 'text-accent-foreground');
  }
  setInactiveStyles(): void {
    this.host.nativeElement.classList.remove('bg-accent', 'text-accent-foreground');
  }
  focus(): void {
    this.host.nativeElement.focus();
  }

  /**
   * Host (focus) handler. Notifies the menu that this item is now focused so it
   * can sync its active-item tracking (used for keyboard navigation to submenus).
   * Native focus is NOT re-triggered here, avoiding recursion with `focus()`.
   */
  protected onFocus(): void {
    this.menu.setActiveElement?.(this.host.nativeElement);
  }

  /**
   * Mouse enter — open this item's submenu (or close a sibling's) so nested
   * menus work with mouse as well as keyboard.
   */
  protected onPointerEnter(): void {
    if (this.disabledInput()) return;
    this.menu.setActiveElement?.(this.host.nativeElement);
    if (this.submenu()) {
      this.menu.openSubmenu?.(this.host.nativeElement);
    } else {
      this.menu.closeChildSubmenu?.();
    }
  }

  getLabel(): string {
    return this.host.nativeElement.textContent?.trim() ?? '';
  }

  /** Get the host element (used by menu for submenu positioning). */
  getHostElement(): HTMLElement {
    return this.host.nativeElement;
  }
}
