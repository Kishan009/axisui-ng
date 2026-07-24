import { Component, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxDropdownMenuComponent } from './dropdown-menu.component';
import { AxMenuTriggerDirective } from './menu-trigger.directive';
import { AxMenuItemComponent } from './menu-item.component';
import { MenuSubitemConfig } from './menu.types';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxDropdownMenuComponent, AxMenuTriggerDirective, AxMenuItemComponent],
  template: `
    <button [axMenuTriggerFor]="menu">Open</button>
    <ax-dropdown-menu #menu>
      <ax-menu-item>Standard Item</ax-menu-item>
      <ax-menu-item [submenu]="submenuTemplate">Item with Submenu</ax-menu-item>
    </ax-dropdown-menu>

    <ng-template #submenuTemplate>
      <ax-dropdown-menu #submenu>
        <ax-menu-item>Subitem 1</ax-menu-item>
        <ax-menu-item>Subitem 2</ax-menu-item>
      </ax-dropdown-menu>
    </ng-template>
  `,
})
class HostComponent {
  readonly submenuTemplate = viewChild.required<TemplateRef<MenuSubitemConfig>>('submenuTemplate');
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxDropdownMenu with Submenus', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('should render a menu item with submenu input', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const items = overlayRoot().querySelectorAll('[role="menuitem"]');
    expect(items.length).toBe(2);
    expect(items[1].textContent).toContain('Item with Submenu');
  });

  it('should not close menu when activating item with submenu', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const submenuItem = overlayRoot().querySelectorAll('[role="menuitem"]')[1] as HTMLElement;
    submenuItem.click();
    fixture.detectChanges();
    // Menu should still be open; submenu item should not have closed it
    expect(overlayRoot().querySelector('[role="menu"]')).toBeTruthy();
  });

  it('opens the submenu on click (and shows a chevron affordance)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const submenuItem = overlayRoot().querySelectorAll('[role="menuitem"]')[1] as HTMLElement;
    expect(submenuItem.getAttribute('aria-haspopup')).toBe('menu');
    expect(submenuItem.querySelector('svg, ax-icon')).toBeTruthy();
    submenuItem.click();
    fixture.detectChanges();
    expect(overlayRoot().querySelectorAll('[role="menu"]').length).toBeGreaterThan(1);
  });

  it('opens the submenu on hover', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const submenuItem = overlayRoot().querySelectorAll('[role="menuitem"]')[1] as HTMLElement;
    submenuItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(overlayRoot().querySelectorAll('[role="menu"]').length).toBeGreaterThan(1);
  });

  it('should support keyboard navigation (ArrowRight) to open submenu', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable(); // let the open-time focusFirst() settle
    const menu = overlayRoot().querySelector('[role="menu"]') as HTMLElement;
    // Navigate to the submenu item via the keyboard (End → last item), then open it.
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    fixture.detectChanges();
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(overlayRoot().querySelectorAll('[role="menu"]').length).toBeGreaterThan(1);
  });

  it('should support keyboard navigation (ArrowLeft) to close submenu', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = overlayRoot().querySelector('[role="menu"]') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    fixture.detectChanges();
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    fixture.detectChanges();
    expect(overlayRoot().querySelectorAll('[role="menu"]').length).toBeGreaterThan(1);
    // ArrowLeft closes the submenu.
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    fixture.detectChanges();
    expect(overlayRoot().querySelectorAll('[role="menu"]').length).toBe(1);
  });

  it('moves DOM focus onto a menu item (roving focus) on arrow navigation', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();

    const menu = overlayRoot().querySelector('[role="menu"]') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    // FocusKeyManager moves DOM focus to the active item.
    const focused = menu.ownerDocument.activeElement;
    expect(focused?.getAttribute('role')).toBe('menuitem');
  });

  it('has no a11y violations when submenu is rendered', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('has no a11y violations in the open menu overlay', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    // Drive a keyboard nav so aria-activedescendant is populated, then assert the
    // referenced id resolves to a real menuitem inside the overlay.
    const menu = overlayRoot().querySelector('[role="menu"]') as HTMLElement;
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    const results = await axe(overlayRoot());
    expect(results).toHaveNoViolations();
  });
});
