import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxGaugeComponent } from './gauge.component';

expect.extend(toHaveNoViolations);

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxGaugeComponent> {
  const f = TestBed.createComponent(AxGaugeComponent);
  f.componentRef.setInput('value', 60);
  f.componentRef.setInput('startAngle', 0);
  f.componentRef.setInput('endAngle', 180);
  f.componentRef.setInput('ariaLabel', 'Score');
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

const host = (f: ComponentFixture<AxGaugeComponent>) => f.nativeElement as HTMLElement;

describe('AxGaugeComponent', () => {
  it('exposes meter semantics', () => {
    const el = host(create());
    expect(el.getAttribute('role')).toBe('meter');
    expect(el.getAttribute('aria-valuenow')).toBe('60');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
  });

  it('renders a track arc and a value arc', () => {
    const paths = host(create()).querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect((paths[0] as SVGPathElement).getAttribute('class')).toBe('stroke-border');
    expect((paths[1] as SVGPathElement).getAttribute('class')).toBe('stroke-chart-1');
  });

  it('shows the value (and label) text', () => {
    const el = host(create({ label: 'CPU' }));
    expect(el.textContent).toContain('60');
    expect(el.textContent).toContain('CPU');
  });

  it('colorIndex selects the value-arc palette class', () => {
    const paths = host(create({ colorIndex: 2 })).querySelectorAll('path');
    expect((paths[1] as SVGPathElement).getAttribute('class')).toBe('stroke-chart-2');
  });

  it('announces the value with context via aria-valuetext', () => {
    expect(host(create()).getAttribute('aria-valuetext')).toBe('60 of 100');
    expect(host(create({ value: 30, max: 50 })).getAttribute('aria-valuetext')).toBe('30 of 50');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(host(create({ label: 'CPU' })))).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const f = create();
      host(f).setAttribute('dir', 'rtl');
      expect(await axe(host(f))).toHaveNoViolations();
    });
    it('has no violations in dark mode', async () => {
      const f = create();
      host(f).classList.add('dark');
      expect(await axe(host(f))).toHaveNoViolations();
    });
  });
});
