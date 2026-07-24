import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';

import { AxDropdownMenuComponent, AxMenuItemComponent } from '@axisui-ng/overlays/menu';
import { AxContextMenuTriggerDirective } from './context-menu-trigger.directive';

@Component({
  standalone: true,
  imports: [AxDropdownMenuComponent, AxMenuItemComponent, AxContextMenuTriggerDirective],
  template: `
    <div [axContextMenuTriggerFor]="menu" class="w-24 h-24">Right-click</div>
    <ax-dropdown-menu #menu>
      <ax-menu-item (select)="picked = 'copy'">Copy</ax-menu-item>
    </ax-dropdown-menu>
  `,
})
class HostComponent {
  picked = '';
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxContextMenuTrigger', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('opens the menu on contextmenu (right-click)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const region = fixture.nativeElement.querySelector('div') as HTMLElement;
    const evt = new MouseEvent('contextmenu', { clientX: 10, clientY: 10, bubbles: true, cancelable: true });
    region.dispatchEvent(evt);
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeTruthy();
    expect(evt.defaultPrevented).toBe(true);
  });

  it('opens via keyboard (Shift+F10) for keyboard users', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const region = fixture.nativeElement.querySelector('div') as HTMLElement;
    const evt = new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true });
    region.dispatchEvent(evt);
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeTruthy();
    expect(evt.defaultPrevented).toBe(true);
  });

  it('opens via the ContextMenu key', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const region = fixture.nativeElement.querySelector('div') as HTMLElement;
    region.dispatchEvent(new KeyboardEvent('keydown', { key: 'ContextMenu', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="menu"]')).toBeTruthy();
  });

  it('activates an item and closes', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const region = fixture.nativeElement.querySelector('div') as HTMLElement;
    region.dispatchEvent(new MouseEvent('contextmenu', { clientX: 10, clientY: 10, bubbles: true, cancelable: true }));
    fixture.detectChanges();
    (overlayRoot().querySelector('[role="menuitem"]') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.picked).toBe('copy');
    expect(overlayRoot().querySelector('[role="menu"]')).toBeFalsy();
  });
});
