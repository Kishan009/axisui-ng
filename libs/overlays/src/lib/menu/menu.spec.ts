import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxDropdownMenuComponent } from './dropdown-menu.component';
import { AxMenuTriggerDirective } from './menu-trigger.directive';
import { AxMenuItemComponent } from './menu-item.component';
import { AxMenuCheckboxItemComponent } from './menu-checkbox-item.component';
import { AxMenuSeparatorComponent } from './menu-separator.component';
import { AxMenuLabelComponent } from './menu-label.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [
    AxDropdownMenuComponent, AxMenuTriggerDirective, AxMenuItemComponent,
    AxMenuCheckboxItemComponent, AxMenuSeparatorComponent, AxMenuLabelComponent,
  ],
  template: `
    <button [axMenuTriggerFor]="menu">Open</button>
    <ax-dropdown-menu #menu>
      <ax-menu-label>Actions</ax-menu-label>
      <ax-menu-item (select)="picked = 'edit'">Edit</ax-menu-item>
      <ax-menu-separator />
      <ax-menu-checkbox-item [(checked)]="showGrid">Show grid</ax-menu-checkbox-item>
    </ax-dropdown-menu>
  `,
})
class HostComponent {
  picked = '';
  showGrid = false;
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxDropdownMenu', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('opens on trigger click with role=menu', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeTruthy();
    expect(overlayRoot().querySelectorAll('[role="menuitem"]').length).toBe(1);
  });

  it('emits select and closes when an item is activated', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const item = overlayRoot().querySelector('[role="menuitem"]') as HTMLElement;
    item.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.picked).toBe('edit');
    expect(overlayRoot().querySelector('[role="menu"]')).toBeFalsy();
  });

  it('toggles a checkbox item', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const cb = overlayRoot().querySelector('[role="menuitemcheckbox"]') as HTMLElement;
    cb.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.showGrid).toBe(true);
  });

  it('includes checkbox items in keyboard navigation and toggles them with Enter', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const menu = overlayRoot().querySelector('[role="menu"]') as HTMLElement;
    // End jumps to the last navigable item — which must include the checkbox.
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
    fixture.detectChanges();
    expect(menu.ownerDocument.activeElement?.getAttribute('role')).toBe('menuitemcheckbox');
    menu.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.showGrid).toBe(true);
  });

  it('has no a11y violations when open', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLElement).click();
    fixture.detectChanges();
    const results = await axe(overlayRoot());
    expect(results).toHaveNoViolations();
  });
});
