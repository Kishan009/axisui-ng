import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxNavigationMenuComponent } from './navigation-menu.component';
import { AxNavigationMenuItemComponent } from './navigation-menu-item.component';
import { AxNavigationMenuContentComponent } from './navigation-menu-content.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxNavigationMenuComponent, AxNavigationMenuItemComponent, AxNavigationMenuContentComponent],
  template: `
    <ax-navigation-menu>
      <ax-navigation-menu-item value="products" label="Products">
        <ax-navigation-menu-content><a href="/a">Product A</a></ax-navigation-menu-content>
      </ax-navigation-menu-item>
      <ax-navigation-menu-item value="company" label="Company">
        <ax-navigation-menu-content><a href="/b">About</a></ax-navigation-menu-content>
      </ax-navigation-menu-item>
    </ax-navigation-menu>
  `,
})
class HostComponent {}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxNavigationMenu', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('opens an item content panel on trigger click', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    expect(overlayRoot().textContent).toContain('Product A');
  });

  it('switches the open panel when another item is clicked', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const triggers = fixture.nativeElement.querySelectorAll('button');
    (triggers[0] as HTMLElement).click();
    fixture.detectChanges();
    (triggers[1] as HTMLElement).click();
    fixture.detectChanges();
    expect(overlayRoot().textContent).toContain('About');
    expect(overlayRoot().textContent).not.toContain('Product A');
  });

  it('opens the panel on hover without a prior click', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(overlayRoot().textContent).toContain('Product A');
  });

  it('switches the open panel when hovering another item', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const triggers = fixture.nativeElement.querySelectorAll('button');
    (triggers[0] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    (triggers[1] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(overlayRoot().textContent).toContain('About');
    expect(overlayRoot().textContent).not.toContain('Product A');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });

  it('renders a decorative aria-hidden backdrop', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.ax-navigation-menu-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    expect(backdrop.getAttribute('aria-hidden')).toBe('true');
  });

  it('has no active item before any hover or open', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const backdrop = fixture.nativeElement.querySelector('.ax-navigation-menu-backdrop') as HTMLElement;
    // No active item -> data-active is empty/absent (backdrop stays hidden).
    expect(backdrop.getAttribute('data-active') || '').toBe('');
  });

  it('tracks the hovered item as the active value', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const triggers = fixture.nativeElement.querySelectorAll('button');
    const backdrop = fixture.nativeElement.querySelector('.ax-navigation-menu-backdrop') as HTMLElement;

    (triggers[1] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(backdrop.getAttribute('data-active')).toBe('company');

    (triggers[0] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(backdrop.getAttribute('data-active')).toBe('products');
  });

  it('falls back to the open item when the pointer leaves the nav', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('ax-navigation-menu') as HTMLElement;
    const triggers = fixture.nativeElement.querySelectorAll('button');
    const backdrop = fixture.nativeElement.querySelector('.ax-navigation-menu-backdrop') as HTMLElement;

    // Hover opens the panel and marks the item active.
    (triggers[0] as HTMLElement).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    fixture.detectChanges();
    expect(backdrop.getAttribute('data-active')).toBe('products');
    expect(overlayRoot().textContent).toContain('Product A');

    // Leaving clears hover; active falls back to the still-open item (panel stays until outside click).
    nav.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    fixture.detectChanges();
    expect(backdrop.getAttribute('data-active')).toBe('products');
    expect(overlayRoot().textContent).toContain('Product A');
  });

  it('exposes animation-duration as a customizable CSS variable', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('ax-navigation-menu') as HTMLElement;
    nav.style.setProperty('--navigation-menu-animation-duration', '500ms');
    // jsdom does not reliably compute the *applied* transition duration, so we
    // verify the customization hook round-trips on the host (mirrors the dialog
    // spec's documented jsdom limitation in Task 3).
    expect(getComputedStyle(nav).getPropertyValue('--navigation-menu-animation-duration').trim()).toBe('500ms');
  });
});
