import { Component, signal } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { type CalendarMode, type CalendarValue, type DateRange } from '../calendar/date-core';
import { AxDatePickerComponent } from './date-picker.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxDatePickerComponent],
  template: `<ax-date-picker [mode]="mode()" [(value)]="value" />`,
})
class HostComponent {
  mode = signal<CalendarMode>('single');
  value = signal<CalendarValue>(null);
}

function setup() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [HostComponent],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return fixture;
}

function input(fixture: ReturnType<typeof setup>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input') as HTMLInputElement;
}

function overlayEl(): HTMLElement {
  return TestBed.inject(OverlayContainer).getContainerElement();
}

describe('AxDatePicker', () => {
  it('opens the calendar overlay on focus', () => {
    const fixture = setup();
    input(fixture).dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(overlayEl().querySelector('ax-calendar')).toBeTruthy();
  });

  it('parses valid typed text into the value (single)', () => {
    const fixture = setup();
    const el = input(fixture);
    el.value = '2026-06-05';
    el.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const v = fixture.componentInstance.value() as Date;
    expect(v.getFullYear()).toBe(2026);
    expect(v.getMonth()).toBe(5);
    expect(v.getDate()).toBe(5);
    expect(el.getAttribute('aria-invalid')).toBeNull();
  });

  it('marks aria-invalid on unparseable text', () => {
    const fixture = setup();
    const el = input(fixture);
    el.value = 'not-a-date';
    el.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(el.getAttribute('aria-invalid')).toBe('true');
  });

  it('parses a typed range "start – end"', () => {
    const fixture = setup();
    fixture.componentInstance.mode.set('range');
    fixture.detectChanges();
    const el = input(fixture);
    el.value = '2026-06-05 – 2026-06-10';
    el.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    const r = fixture.componentInstance.value() as DateRange;
    expect(r.start?.getDate()).toBe(5);
    expect(r.end?.getDate()).toBe(10);
  });

  it('selecting a day fills the input and closes (single)', () => {
    const fixture = setup();
    input(fixture).dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const dayCells = Array.from(
      overlayEl().querySelectorAll('ax-calendar button[role="gridcell"]')
    ) as HTMLButtonElement[];
    const target = dayCells.find((b) => !b.hasAttribute('data-outside') && b.textContent?.trim() === '15')!;
    target.click();
    fixture.detectChanges();
    expect((fixture.componentInstance.value() as Date).getDate()).toBe(15);
    expect(overlayEl().querySelector('ax-calendar')).toBeNull();
  });

  it('has no a11y violations (closed)', async () => {
    const fixture = setup();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
