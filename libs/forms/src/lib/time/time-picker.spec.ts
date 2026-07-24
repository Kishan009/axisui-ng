import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxTimePickerComponent } from './time-picker.component';
import { type TimeValue } from './time-core';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxTimePickerComponent],
  template: `<ax-time-picker [(value)]="value" [use24]="use24()" [withSeconds]="withSeconds()" [minuteStep]="minuteStep()" />`,
})
class HostComponent {
  value = signal<TimeValue | null>({ hours: 9, minutes: 30 });
  use24 = signal(true);
  withSeconds = signal(false);
  minuteStep = signal(1);
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

function segments(fixture: ReturnType<typeof setup>): HTMLInputElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('input[role="spinbutton"]'));
}

describe('AxTimePicker', () => {
  it('renders HH and MM segments (no seconds by default)', () => {
    const fixture = setup();
    expect(segments(fixture).length).toBe(2);
  });

  it('renders a seconds segment when withSeconds', () => {
    const fixture = setup((h) => h.withSeconds.set(true));
    expect(segments(fixture).length).toBe(3);
  });

  it('ArrowUp on minutes increments and respects minuteStep', () => {
    const fixture = setup((h) => h.minuteStep.set(15));
    const [, minutes] = segments(fixture);
    minutes.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()?.minutes).toBe(45);
  });

  it('ArrowUp on hours wraps 23 → 0', () => {
    const fixture = setup((h) => h.value.set({ hours: 23, minutes: 0 }));
    const [hours] = segments(fixture);
    hours.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.value()?.hours).toBe(0);
  });

  it('shows an AM/PM toggle only in 12h mode and flips canonical hours', () => {
    const fixture = setup((h) => {
      h.use24.set(false);
      h.value.set({ hours: 9, minutes: 0 });
    });
    const toggle = fixture.nativeElement.querySelector('button[data-period]') as HTMLButtonElement;
    expect(toggle).toBeTruthy();
    toggle.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()?.hours).toBe(21);
  });

  it('has no a11y violations', async () => {
    const fixture = setup();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
