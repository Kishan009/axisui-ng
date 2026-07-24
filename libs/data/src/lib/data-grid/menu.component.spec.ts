import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxDataGridMenuComponent } from './menu.component';
import { type GridMenuItem } from './menu-core';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxDataGridMenuComponent],
  template: `<ax-data-grid-menu [items]="items()" [x]="0" [y]="0" (select)="onSelect($event)" (close)="closed = true" />`,
})
class Host {
  readonly items = signal<GridMenuItem[]>([]);
  selected: string | null = null;
  closed = false;
  onSelect(id: string): void { this.selected = id; }
}

const items: GridMenuItem[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Bravo', separatorBefore: true },
  { id: 'c', label: 'Charlie', disabled: true },
];

function setup() {
  const f = TestBed.configureTestingModule({ imports: [Host] }).createComponent(Host);
  f.componentInstance.items.set(items);
  f.detectChanges();
  return f;
}

describe('AxDataGridMenuComponent', () => {
  it('renders a role=menu with enabled menuitems and a separator', () => {
    const f = setup();
    const menu = f.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    expect(menu).not.toBeNull();
    const itemsEls = f.nativeElement.querySelectorAll('[role="menuitem"]');
    expect(itemsEls.length).toBe(3);
    expect(f.nativeElement.querySelector('[role="separator"]')).not.toBeNull();
  });

  it('emits select with the item id on click; disabled items do not emit', () => {
    const f = setup();
    (f.nativeElement.querySelector('[data-menu-item="a"]') as HTMLElement).click();
    expect(f.componentInstance.selected).toBe('a');
    f.componentInstance.selected = null;
    (f.nativeElement.querySelector('[data-menu-item="c"]') as HTMLElement).click();
    expect(f.componentInstance.selected).toBeNull();
  });

  it('closes on Escape', () => {
    const f = setup();
    const menu = f.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.closed).toBe(true);
  });

  it('ArrowDown moves focus to the next enabled item and Enter selects it', () => {
    const f = setup();
    const menu = f.nativeElement.querySelector('[role="menu"]') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    f.detectChanges();
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.selected).toBe('b'); // skips nothing; a->b
  });

  it('has no a11y violations', async () => {
    const f = setup();
    expect(await axe(f.nativeElement)).toHaveNoViolations();
  });
});
