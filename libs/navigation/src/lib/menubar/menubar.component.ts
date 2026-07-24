import { ChangeDetectionStrategy, Component, ElementRef, forwardRef, inject, signal } from '@angular/core';

import { MENUBAR_CONTEXT, type MenubarContext } from './menubar.types';

/**
 * Menubar — an application menu bar. Contains <ax-menubar-menu> elements.
 *
 * @example
 * <ax-menubar>
 *   <ax-menubar-menu label="File"><ax-dropdown-menu>…</ax-dropdown-menu></ax-menubar-menu>
 * </ax-menubar>
 */
@Component({
  selector: 'ax-menubar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'menubar',
    class: 'inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-border bg-background p-1',
  },
  template: `<ng-content select="ax-menubar-menu" />`,
  providers: [{ provide: MENUBAR_CONTEXT, useExisting: forwardRef(() => AxMenubarComponent) }],
})
export class AxMenubarComponent implements MenubarContext {
  private readonly hostRef = inject(ElementRef<HTMLElement>);
  private readonly ids: string[] = [];
  private readonly _openId = signal<string | null>(null);
  readonly openId = this._openId.asReadonly();

  register(id: string): void {
    if (!this.ids.includes(id)) this.ids.push(id);
  }
  setOpen(id: string | null): void {
    this._openId.set(id);
  }
  focusByOffset(fromId: string, offset: number): void {
    const triggers = Array.from(
      (this.hostRef.nativeElement as HTMLElement).querySelectorAll('[role="menuitem"]'),
    ) as HTMLElement[];
    if (triggers.length === 0) return;
    const idx = this.ids.indexOf(fromId);
    const nextIndex = (idx + offset + triggers.length) % triggers.length;
    triggers[nextIndex]?.focus();
    // If a menu is already open, move the open menu to the newly focused one.
    if (this._openId() !== null) {
      this._openId.set(this.ids[nextIndex] ?? null);
    }
  }
}
