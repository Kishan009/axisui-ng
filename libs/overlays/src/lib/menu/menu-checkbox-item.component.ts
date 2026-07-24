import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, model } from '@angular/core';

import { AxIconComponent } from '@axisui-ng/icons';
import { cn } from '@axisui-ng/overlays-core';
import type { MenuNavigableItem } from './menu.types';

const ITEM_BASE =
  'flex w-full cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm outline-none ' +
  'transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-out-quart active:scale-[0.98] ' +
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ' +
  'aria-disabled:pointer-events-none aria-disabled:opacity-50';

/** A checkbox menu item with a check indicator. */
@Component({
  selector: 'ax-menu-checkbox-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AxIconComponent],
  host: {
    role: 'menuitemcheckbox',
    tabindex: '-1',
    '[attr.aria-checked]': 'checked()',
    '[attr.aria-disabled]': 'disabledInput() ? "true" : null',
    '[class]': 'classes()',
    '(click)': 'toggle()',
  },
  template: `
    <span class="flex h-4 w-4 items-center justify-center">
      @if (checked()) { <ax-icon name="check" [size]="14" /> }
    </span>
    <ng-content />
  `,
})
export class AxMenuCheckboxItemComponent implements MenuNavigableItem {
  /** Checked state (two-way). @default false */
  readonly checked = model<boolean>(false);
  /** Disable the item (skipped by keyboard navigation). @default false */
  // eslint-disable-next-line @angular-eslint/no-input-rename -- aliased to `disabled` so it coexists with the Highlightable `disabled` getter
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly classes = computed(() =>
    cn(
      ITEM_BASE,
      'hover:bg-accent hover:text-accent-foreground active:bg-accent/80 focus:bg-accent focus:text-accent-foreground',
    ),
  );

  /** Read (as a property) by the key manager to skip this item. */
  get disabled(): boolean {
    return this.disabledInput();
  }

  protected toggle(): void {
    if (this.disabledInput()) return;
    this.checked.update((v) => !v);
  }
  setActiveStyles(): void {
    this.host.nativeElement.classList.add('bg-accent', 'text-accent-foreground');
  }
  setInactiveStyles(): void {
    this.host.nativeElement.classList.remove('bg-accent', 'text-accent-foreground');
  }
  focus(): void {
    this.host.nativeElement.focus();
  }
  getHostElement(): HTMLElement {
    return this.host.nativeElement;
  }
  getLabel(): string {
    return this.host.nativeElement.textContent?.trim() ?? '';
  }
}
