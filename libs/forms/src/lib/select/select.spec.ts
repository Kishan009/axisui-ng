import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSelectComponent, type AxSelectOption } from './select.component';

expect.extend(toHaveNoViolations);

const OPTIONS: AxSelectOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'de', label: 'Germany' },
  { value: 'jp', label: 'Japan' },
];

@Component({
  standalone: true,
  imports: [AxSelectComponent],
  template: `
    <ax-select
      [options]="options"
      [(value)]="value"
      [placeholder]="placeholder"
      ariaLabel="Country"
    />
  `,
})
class HostComponent {
  options = OPTIONS;
  value: string | null = null;
  placeholder = 'Select a country';
}

function overlayRoot(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxSelectComponent', () => {
  afterEach(() => TestBed.inject(OverlayContainer).ngOnDestroy());

  it('renders a combobox trigger with placeholder when empty', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    expect(trigger).toBeTruthy();
    expect(trigger.textContent).toContain('Select a country');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens a token-styled listbox panel (not a native select popup)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const list = overlayRoot().querySelector('[role="listbox"]') as HTMLElement;
    expect(list).toBeTruthy();
    expect(list.getAttribute('data-ax-overlay')).toBe('');
    expect(list.className).toContain('rounded-[var(--radius-field)]');
    expect(list.className).toContain('border-border');
    expect(overlayRoot().textContent).toContain('United States');
    expect(overlayRoot().textContent).toContain('Japan');
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
  });

  it('selects an option and closes the panel', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const option = overlayRoot().querySelector('[role="option"]') as HTMLElement;
    option.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toBe('us');
    expect(trigger.textContent).toContain('United States');
    expect(overlayRoot().querySelector('[role="listbox"]')).toBeNull();
  });

  it('navigates and selects with the keyboard', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(overlayRoot().querySelector('[role="listbox"]')).toBeTruthy();

    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.value).toBe('gb');
  });

  it('has no a11y violations when closed and when open', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();

    (fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    expect(await axe(overlayRoot())).toHaveNoViolations();
  });
});
