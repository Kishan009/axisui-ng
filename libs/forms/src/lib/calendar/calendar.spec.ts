import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxCalendarComponent } from './calendar.component';
import { type CalendarMode, type CalendarValue, type DateRange } from './date-core';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxCalendarComponent],
  template: `<ax-calendar [mode]="mode()" [(value)]="value" [min]="min()" [max]="max()" />`,
})
class HostComponent {
  mode = signal<CalendarMode>('single');
  value = signal<CalendarValue>(null);
  min = signal<Date | null>(null);
  max = signal<Date | null>(null);
}

function setup(configure?: (h: HostComponent) => void) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [HostComponent],
  });
  const fixture = TestBed.createComponent(HostComponent);
  if (configure) configure(fixture.componentInstance);
  fixture.detectChanges();
  return fixture;
}

function dayButtons(fixture: ReturnType<typeof setup>): HTMLButtonElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('button[role="gridcell"]'));
}

describe('AxCalendar', () => {
  it('renders a 6x7 grid (42 day cells) and weekday headers', () => {
    const fixture = setup((h) => h.value.set(new Date(2026, 5, 15)));
    expect(dayButtons(fixture).length).toBe(42);
    expect(fixture.nativeElement.querySelectorAll('[role="columnheader"]').length).toBe(7);
  });

  it('selects a single date on click', () => {
    const fixture = setup((h) => h.value.set(new Date(2026, 5, 15)));
    const cells = dayButtons(fixture);
    const tenth = cells.find((b) => b.textContent?.trim() === '10' && !b.hasAttribute('data-outside'));
    tenth!.click();
    fixture.detectChanges();
    const v = fixture.componentInstance.value() as Date;
    expect(v.getDate()).toBe(10);
  });

  it('builds an ordered range across two clicks', () => {
    const fixture = setup((h) => {
      h.mode.set('range');
      h.value.set(null);
    });
    const cells = dayButtons(fixture).filter((b) => !b.hasAttribute('data-outside'));
    const byDay = (n: number) => cells.find((b) => b.textContent?.trim() === String(n))!;
    byDay(20).click();
    fixture.detectChanges();
    byDay(10).click();
    fixture.detectChanges();
    const r = fixture.componentInstance.value() as DateRange;
    expect(r.start?.getDate()).toBe(10);
    expect(r.end?.getDate()).toBe(20);
  });

  it('disables days outside min/max and blocks their selection', () => {
    const fixture = setup((h) => {
      h.value.set(new Date(2026, 5, 15));
      h.min.set(new Date(2026, 5, 10));
    });
    const cells = dayButtons(fixture).filter((b) => !b.hasAttribute('data-outside'));
    const fifth = cells.find((b) => b.textContent?.trim() === '5')!;
    expect(fifth.getAttribute('aria-disabled')).toBe('true');
    expect(fifth.disabled).toBe(true);
  });

  it('navigates months via the next button', () => {
    const fixture = setup((h) => h.value.set(new Date(2026, 5, 15)));
    const label = () => fixture.nativeElement.querySelector('[aria-live="polite"]').textContent.trim();
    const before = label();
    (fixture.nativeElement.querySelector('button[aria-label="Next month"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(label()).not.toBe(before);
  });

  it('keyboard: ArrowRight then Enter selects the next day', () => {
    const fixture = setup((h) => h.value.set(new Date(2026, 5, 15)));
    const grid = fixture.nativeElement.querySelector('[role="grid"]') as HTMLElement;
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    grid.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    const v = fixture.componentInstance.value() as Date;
    expect(v.getDate()).toBe(16);
  });

  it('has no a11y violations', async () => {
    const fixture = setup((h) => h.value.set(new Date(2026, 5, 15)));
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
