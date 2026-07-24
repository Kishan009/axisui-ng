import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSparklineComponent } from './sparkline.component';

expect.extend(toHaveNoViolations);

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxSparklineComponent> {
  const f = TestBed.createComponent(AxSparklineComponent);
  f.componentRef.setInput('data', [1, 5, 2, 8, 3]);
  f.componentRef.setInput('ariaLabel', 'Trend');
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

describe('AxSparklineComponent', () => {
  it('renders a line path from the data', () => {
    const path = create().nativeElement.querySelector('path[stroke-width="2"]') as SVGPathElement;
    expect(path.getAttribute('d')).toContain('M');
    expect(path.getAttribute('class')).toBe('stroke-chart-1');
  });

  it('adds a filled area path in area mode', () => {
    const paths = create({ type: 'area' }).nativeElement.querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect((paths[0] as SVGPathElement).getAttribute('d')).toContain('Z');
  });

  it('colorIndex selects the chart palette class', () => {
    const path = create({ colorIndex: 3 }).nativeElement.querySelector('path[stroke-width="2"]') as SVGPathElement;
    expect(path.getAttribute('class')).toBe('stroke-chart-3');
  });

  it('shows a dot on the last point when showDot', () => {
    expect(create({ showDot: true }).nativeElement.querySelector('circle')).toBeTruthy();
  });

  it('generates a descriptive aria-label from the series when none is provided', () => {
    const svg = create({ ariaLabel: '' }).nativeElement.querySelector('svg') as SVGElement;
    const label = svg.getAttribute('aria-label') ?? '';
    // data [1,5,2,8,3]: 5 points, first 1 < last 3 → trending up, range 1..8
    expect(label).toContain('5 points');
    expect(label).toContain('trending up');
    expect(label).toContain('latest 3');
    expect(label).toContain('range 1 to 8');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create().nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const f = create();
      (f.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in dark mode', async () => {
      const f = create();
      (f.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });
});
