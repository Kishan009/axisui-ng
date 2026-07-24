import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxStatisticComponent } from './statistic.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxStatisticComponent],
  template: `<ax-statistic label="Revenue" [value]="value()" prefix="$" [trend]="trend()" locale="en-US" />`,
})
class HostComponent {
  value = signal<number | string>(12345);
  trend = signal<number | null>(12);
}

function render(configure?: (h: HostComponent) => void) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ imports: [HostComponent] });
  const f = TestBed.createComponent(HostComponent);
  if (configure) configure(f.componentInstance);
  f.detectChanges();
  return f;
}

describe('AxStatistic', () => {
  it('renders label, prefix and grouped value', () => {
    const el = render().nativeElement;
    expect(el.textContent).toContain('Revenue');
    expect(el.textContent).toContain('$12,345');
  });
  it('shows an up trend in success color when positive', () => {
    const el = render((h) => h.trend.set(12)).nativeElement;
    expect(el.querySelector('[data-ax-icon="chevron-up"]')).toBeTruthy();
    expect(el.querySelector('.text-success')).toBeTruthy();
  });
  it('shows a down trend in destructive color when negative', () => {
    const el = render((h) => h.trend.set(-5)).nativeElement;
    expect(el.querySelector('[data-ax-icon="chevron-down"]')).toBeTruthy();
    expect(el.querySelector('.text-destructive')).toBeTruthy();
  });
  it('omits the trend row when trend is null', () => {
    const el = render((h) => h.trend.set(null)).nativeElement;
    expect(el.querySelector('[data-ax-icon="chevron-up"]')).toBeNull();
    expect(el.querySelector('[data-ax-icon="chevron-down"]')).toBeNull();
  });
  it('has no a11y violations', async () => {
    const results = await axe(render().nativeElement);
    expect(results).toHaveNoViolations();
  });
});
