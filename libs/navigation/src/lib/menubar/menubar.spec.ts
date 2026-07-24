import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxDropdownMenuComponent, AxMenuItemComponent } from '@axisui-ng/overlays';
import { AxMenubarComponent } from './menubar.component';
import { AxMenubarMenuComponent } from './menubar-menu.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxMenubarComponent, AxMenubarMenuComponent, AxDropdownMenuComponent, AxMenuItemComponent],
  template: `
    <ax-menubar>
      <ax-menubar-menu label="File">
        <ax-dropdown-menu>
          <ax-menu-item (select)="picked = 'new'">New</ax-menu-item>
        </ax-dropdown-menu>
      </ax-menubar-menu>
      <ax-menubar-menu label="Edit">
        <ax-dropdown-menu>
          <ax-menu-item (select)="picked = 'undo'">Undo</ax-menu-item>
        </ax-dropdown-menu>
      </ax-menubar-menu>
    </ax-menubar>
  `,
})
class HostComponent {
  picked = '';
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxMenubar', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('renders a menubar with menuitem triggers', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="menubar"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('[role="menuitem"]').length).toBe(2);
  });

  it('opens a menu on trigger click and activates an item', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const fileTrigger = fixture.nativeElement.querySelectorAll('[role="menuitem"]')[0] as HTMLElement;
    fileTrigger.click();
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeTruthy();
    (overlayRoot().querySelector('[role="menuitem"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.picked).toBe('new');
  });

  it('closes the dropdown and clears selection state when an item is selected', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const fileTrigger = fixture.nativeElement.querySelectorAll('[role="menuitem"]')[0] as HTMLElement;
    fileTrigger.click();
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeTruthy();

    (overlayRoot().querySelector('[role="menuitem"]') as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance.picked).toBe('new');
    expect(overlayRoot().querySelector('[role="menu"]')).toBeNull();
  });

  it('opens a fresh menu on the next trigger after a selection', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const triggers = fixture.nativeElement.querySelectorAll('[role="menuitem"]');
    const fileTrigger = triggers[0] as HTMLElement;
    const editTrigger = triggers[1] as HTMLElement;

    fileTrigger.click();
    fixture.detectChanges();
    (overlayRoot().querySelector('[role="menuitem"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeNull();

    editTrigger.click();
    fixture.detectChanges();
    const menu = overlayRoot().querySelector('[role="menu"]');
    expect(menu).toBeTruthy();
    expect(menu?.textContent).toContain('Undo');
  });

  it('toggles closed on a second trigger click without reopening', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const fileTrigger = fixture.nativeElement.querySelectorAll('[role="menuitem"]')[0] as HTMLElement;

    fileTrigger.click();
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeTruthy();

    // Regression: outsidePointerEvents on the trigger used to close then toggle
    // would re-open (blink). Second click must end closed.
    fileTrigger.click();
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeNull();
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
