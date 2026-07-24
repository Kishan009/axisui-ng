import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxComboboxComponent } from './combobox.component';
import type { ComboboxOption } from './combobox.types';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxComboboxComponent],
  template: `
    <ax-combobox
      [options]="options"
      [(value)]="value"
      placeholder="Pick one"
      (searchChange)="lastSearch = $event"
    />
  `,
})
class HostComponent {
  options: ComboboxOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ];
  value: string | string[] | null = null;
  lastSearch = '';
}

describe('AxComboboxComponent', () => {
  it('renders the placeholder when nothing selected', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLElement;
    expect(trigger.textContent).toContain('Pick one');
  });

  it('opens the listbox on trigger click', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('applies the overlay animation contract to the open panel', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    const panel = TestBed.inject(OverlayContainer)
      .getContainerElement()
      .querySelector('[role="listbox"]') as HTMLElement;
    expect(panel.hasAttribute('data-ax-overlay')).toBe(true);
    expect(panel.getAttribute('data-state')).toBe('open');
  });

  it('sizes the overlay pane to the trigger width', () => {
    const fixture = TestBed.createComponent(HostComponent);
    const host = fixture.nativeElement as HTMLElement;
    host.style.width = '320px';
    fixture.detectChanges();
    const trigger = host.querySelector('button[role="combobox"]') as HTMLButtonElement;
    const triggerWidth = trigger.getBoundingClientRect().width;
    trigger.click();
    fixture.detectChanges();
    const pane = TestBed.inject(OverlayContainer)
      .getContainerElement()
      .querySelector('.cdk-overlay-pane') as HTMLElement;
    expect(pane.style.width).toBe(`${triggerWidth}px`);
  });

  it('navigates options with the arrow keys and selects with Enter', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    const key = (k: string) => {
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      fixture.detectChanges();
    };
    key('ArrowDown'); // opens, active = first option
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-activedescendant')).toBe('ax-combobox-opt-0');
    key('ArrowDown'); // move to second option (Canada)
    expect(trigger.getAttribute('aria-activedescendant')).toBe('ax-combobox-opt-1');
    key('Enter'); // select active
    expect(fixture.componentInstance.value).toBe('ca');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('has no a11y violations (closed)', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});

@Component({
  standalone: true,
  imports: [AxComboboxComponent, ReactiveFormsModule],
  template: `<ax-combobox [options]="options" [formControl]="ctrl" placeholder="Pick one" />`,
})
class ReactiveHostComponent {
  options: ComboboxOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
  ];
  ctrl = new FormControl<string | null>(null);
}

describe('AxComboboxComponent — ControlValueAccessor', () => {
  it('shows the FormControl selection in the trigger', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.componentInstance.ctrl.setValue('ca');
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLElement;
    expect(trigger.textContent).toContain('Canada');
  });

  it('propagates a selection back to the FormControl', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();
    const container = TestBed.inject(OverlayContainer).getContainerElement();
    const firstOption = container.querySelector('[role="option"]') as HTMLElement;
    firstOption.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.ctrl.value).toBe('us');
  });

  it('disables the trigger when the FormControl is disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHostComponent);
    fixture.componentInstance.ctrl.disable();
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('button[role="combobox"]') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
  });
});

@Component({
  standalone: true,
  imports: [AxComboboxComponent],
  template: `
    <ax-combobox [options]="options" [(value)]="value" [multiple]="true" [chips]="true" placeholder="Pick many" ariaLabel="Tags" />
  `,
})
class ChipsHostComponent {
  options: ComboboxOption[] = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ];
  value: string | string[] | null = ['us', 'ca'];
}

describe('AxComboboxComponent — chips (MultiSelect)', () => {
  it('uses a div[role="combobox"] trigger with one chip per selection', () => {
    const fixture = TestBed.createComponent(ChipsHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('div[role="combobox"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('button[role="combobox"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('ax-chip').length).toBe(2);
  });

  it('removing a chip filters the value without opening the panel', () => {
    const fixture = TestBed.createComponent(ChipsHostComponent);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('ax-chip button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value).toEqual(['ca']);
    const trigger = fixture.nativeElement.querySelector('div[role="combobox"]') as HTMLElement;
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the panel when the trigger (not a chip) is clicked', () => {
    const fixture = TestBed.createComponent(ChipsHostComponent);
    fixture.detectChanges();
    const trigger = fixture.nativeElement.querySelector('div[role="combobox"]') as HTMLElement;
    trigger.click();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('has no a11y violations (chips mode)', async () => {
    const fixture = TestBed.createComponent(ChipsHostComponent);
    fixture.detectChanges();
    expect(await axe(fixture.nativeElement)).toHaveNoViolations();
  });
});
