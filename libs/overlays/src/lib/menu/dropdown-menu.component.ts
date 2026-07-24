import { FocusKeyManager } from '@angular/cdk/a11y';
import { Directionality } from '@angular/cdk/bidi';
import { Overlay, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  TemplateRef,
  ViewContainerRef,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  model,
  output,
  viewChild,
} from '@angular/core';

import { createConnectedOverlayRef, cn } from '@axisui-ng/overlays-core';
import { MENU_CONTEXT, MENU_SUBMENU_PARENT, type MenuContext, type MenuNavigableItem } from './menu.types';
import { AxMenuItemComponent } from './menu-item.component';
import { AxMenuCheckboxItemComponent } from './menu-checkbox-item.component';
import { AxMenuRadioItemComponent } from './menu-radio-item.component';

/**
 * DropdownMenu — the menu primitive. Open it with [axMenuTriggerFor] (DropdownMenu)
 * or [axContextMenuTriggerFor] (ContextMenu). Project menu-item family components.
 */
@Component({
  selector: 'ax-dropdown-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  providers: [{ provide: MENU_CONTEXT, useExisting: forwardRef(() => AxDropdownMenuComponent) }],
  template: `
    <ng-template #panel>
      <div
        role="menu"
        tabindex="-1"
        data-ax-overlay
        [attr.data-state]="open() ? 'open' : 'closed'"
        [class]="panelClasses"
        (keydown)="onKeydown($event)"
      >
        <ng-content />
      </div>
    </ng-template>

    <!--
      When this menu is itself a submenu (rendered inside a parent menu's submenu
      overlay), it has no trigger to attach its panel, so it renders the panel
      inline. Root menus leave the panel deferred for their trigger to attach.
    -->
    @if (isSubmenu) {
      <ng-container [ngTemplateOutlet]="contentTemplate()" />
    }
  `,
})
export class AxDropdownMenuComponent implements MenuContext {
  /** Open state (driven by the trigger). @default false */
  readonly open = model<boolean>(false);

  /**
   * Emitted when the menu is closed via `close()` — e.g. selecting an item.
   * Consumers like the menubar use this to reset their own open-state.
   */
  readonly closed = output<void>();

  readonly contentTemplate = viewChild.required(TemplateRef);

  /**
   * The parent menu, supplied via the submenu TemplatePortal's injector when this
   * menu is rendered as a submenu. `null` for a root (trigger-driven) menu. When
   * set, this menu renders its panel inline (it has no trigger of its own).
   */
  private readonly parentMenu = inject(MENU_SUBMENU_PARENT, { optional: true });

  /** True when this menu is acting as a submenu and must render its panel inline. */
  protected readonly isSubmenu = this.parentMenu !== null;

  constructor() {
    // A submenu is visible as soon as it is rendered into its overlay, so reflect
    // that in `open` (drives `data-state="open"`). Root menus stay closed until
    // their trigger opens them.
    if (this.isSubmenu) {
      this.open.set(true);
    }

    // Tear down any open submenu whenever this menu closes. The root menu can
    // close via paths that never call close()/closeSubmenu() directly — the
    // trigger flips `open` to false on outside-click/Tab-away and only disposes
    // its own overlay — which would otherwise orphan the submenu's OverlayRef
    // and its outsidePointerEvents subscription in the OverlayContainer.
    effect(() => {
      if (!this.open()) this.closeSubmenu();
    });

    // Belt-and-suspenders: if this view is destroyed (e.g. the panel view is torn
    // down) without `open` ever flipping, still dispose the submenu overlay and
    // the key manager (releases its type-ahead subscription).
    inject(DestroyRef).onDestroy(() => {
      this.closeSubmenu();
      this.keyManager?.destroy();
    });
  }

  // All three item kinds are queried separately, then merged into one DOM-ordered
  // list so the roving FocusKeyManager treats them as a single group.
  private readonly menuItems = contentChildren(AxMenuItemComponent);
  private readonly checkboxItems = contentChildren(AxMenuCheckboxItemComponent);
  private readonly radioItems = contentChildren(AxMenuRadioItemComponent);

  /** Projected navigable items (menu / checkbox / radio), in DOM order. */
  protected readonly items = computed<MenuNavigableItem[]>(() => {
    const all: MenuNavigableItem[] = [...this.menuItems(), ...this.checkboxItems(), ...this.radioItems()];
    // DOCUMENT_POSITION_FOLLOWING = 4: b follows a in the DOM → a sorts first.
    return all.sort((a, b) => (a.getHostElement().compareDocumentPosition(b.getHostElement()) & 4 ? -1 : 1));
  });


  private keyManager: FocusKeyManager<MenuNavigableItem> | null = null;

  private readonly overlay = inject(Overlay);
  private readonly dir = inject(Directionality);
  private readonly vcr = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private currentSubmenuRef: OverlayRef | null = null;
  /** Host element the open submenu is anchored to (avoids re-open flicker). */
  private submenuAnchor: HTMLElement | null = null;

  protected readonly panelClasses = cn(
    'min-w-48 rounded-[var(--radius-md)] border border-border bg-popover p-1',
    'text-popover-foreground shadow-md outline-none',
  );

  /**
   * Called by a menu item when its host element receives focus. Keeps the key
   * manager's active item in sync with the DOM-focused element (without
   * re-focusing) so keyboard handlers operate on the right item.
   */
  setActiveElement(element: HTMLElement): void {
    // Build the manager if a focus event arrives before focusFirst ran, otherwise
    // this early activation would be dropped and keyboard nav would start blank.
    this.ensureKeyManager();
    const item = this.items().find((i) => i.getHostElement() === element);
    if (item) this.keyManager?.updateActiveItem(item);
  }

  /**
   * Called by the trigger after the overlay attaches (items now rendered).
   * Rebuilds the roving key manager and moves DOM focus to the first enabled item
   * — without this, the panel never receives keydown and the menu is unusable by
   * keyboard.
   */
  focusFirst(): void {
    this.rebuildKeyManager();
    this.keyManager?.setFirstItemActive();
  }

  private rebuildKeyManager(): void {
    this.keyManager?.destroy();
    this.keyManager = new FocusKeyManager<MenuNavigableItem>(this.items())
      .withWrap()
      .withHomeAndEnd()
      .withTypeAhead()
      .skipPredicate((i) => i.disabled);
  }

  /** Build the key manager on demand (e.g. a keydown arrives before focusFirst ran). */
  private ensureKeyManager(): void {
    if (!this.keyManager) this.rebuildKeyManager();
  }

  /**
   * Make the currently DOM-focused item the key manager's active item. With roving
   * focus the two normally track each other; this reconciles the case where focus
   * moved by some other means. Uses `ownerDocument.activeElement` (identity) rather
   * than `:focus` — the latter is unreliable in headless DOM. SSR-safe.
   */
  private syncActiveFromFocus(): void {
    const items = this.items();
    if (!items.length || !this.keyManager) return;
    const activeEl = items[0]!.getHostElement().ownerDocument.activeElement;
    const focused = items.find((item) => item.getHostElement() === activeEl);
    if (focused && this.keyManager.activeItem !== focused) {
      this.keyManager.updateActiveItem(focused);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    this.ensureKeyManager();
    this.syncActiveFromFocus();
    const active = this.keyManager?.activeItem ?? null;

    switch (event.key) {
      case 'Escape':
        // Close the innermost open submenu first; only close this menu once there
        // is no submenu left (mirrors ArrowLeft, lets Escape bubble the chain up).
        if (this.currentSubmenuRef) {
          event.preventDefault();
          this.closeSubmenu();
          active?.focus();
        } else {
          this.open.set(false);
        }
        return;
      case 'ArrowRight':
        if (active instanceof AxMenuItemComponent && active.submenu()) {
          event.preventDefault();
          this.openSubmenuForItem(active);
        }
        return;
      case 'ArrowLeft':
        if (this.currentSubmenuRef) {
          event.preventDefault();
          this.closeChildSubmenu();
          active?.focus(); // return focus to the parent item
        }
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.keyManager?.setNextItemActive();
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.keyManager?.setPreviousItemActive();
        return;
      case 'Home':
        event.preventDefault();
        this.keyManager?.setFirstItemActive();
        return;
      case 'End':
        event.preventDefault();
        this.keyManager?.setLastItemActive();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (active instanceof AxMenuItemComponent && active.submenu()) {
          this.openSubmenuForItem(active);
        } else {
          // Every item kind carries its own (click) handler (activate / toggle /
          // choose), so a synthetic click activates any of them uniformly.
          active?.getHostElement().click();
        }
        return;
      default:
        // Printable characters → type-ahead (key manager reads event.key here).
        this.keyManager?.onKeydown(event);
    }
  }

  /**
   * Open the submenu for the item whose host is `host`. Implements
   * {@link MenuContext.openSubmenu} so items can open on click / hover.
   */
  openSubmenu(host: HTMLElement): void {
    const item = this.menuItems().find((i) => i.getHostElement() === host);
    if (item) this.openSubmenuForItem(item);
  }

  /** Close any open child submenu. Implements {@link MenuContext.closeChildSubmenu}. */
  closeChildSubmenu(): void {
    this.currentSubmenuRef?.dispose();
    this.currentSubmenuRef = null;
    this.submenuAnchor = null;
  }

  private openSubmenuForItem(parentItem: AxMenuItemComponent): void {
    const submenuTemplate = parentItem.submenu();
    if (!submenuTemplate) return;

    // Already open for this item — keep it (avoids flicker on repeated hover/click).
    if (this.currentSubmenuRef && this.submenuAnchor === parentItem.getHostElement()) {
      return;
    }

    // Close any existing submenu first.
    this.closeChildSubmenu();
    this.submenuAnchor = parentItem.getHostElement();

    // Position the submenu to the right of the parent item, reusing the shared
    // connected-overlay + placement helpers (direction-aware, with fallback).
    this.currentSubmenuRef = createConnectedOverlayRef(
      this.overlay,
      this.dir,
      parentItem.getHostElement(),
      { side: 'end', align: 'start' },
    );

    // Provide this menu as the submenu's parent so the rendered <ax-dropdown-menu>
    // knows it is a submenu and renders its panel inline (it has no trigger).
    const submenuInjector = Injector.create({
      parent: this.injector,
      providers: [{ provide: MENU_SUBMENU_PARENT, useValue: this }],
    });
    const portal = new TemplatePortal(submenuTemplate, this.vcr, undefined, submenuInjector);
    this.currentSubmenuRef.attach(portal);

    // Move focus into the submenu so keyboard nav continues there.
    queueMicrotask(() => {
      const first = this.currentSubmenuRef?.overlayElement.querySelector(
        '[role="menuitem"]:not([aria-disabled="true"])',
      ) as HTMLElement | null;
      first?.focus();
    });

    // Close the submenu when the user clicks outside it.
    this.currentSubmenuRef.outsidePointerEvents().subscribe(() => this.closeChildSubmenu());
  }

  private closeSubmenu(): void {
    this.closeChildSubmenu();
  }

  close(): void {
    this.closeSubmenu();
    this.open.set(false);
    this.closed.emit();
  }
}
