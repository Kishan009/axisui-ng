import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxHeatmapComponent } from './heatmap.component';

expect.extend(toHaveNoViolations);

const MATRIX = [
  [0, 10],
  [5, 3],
];

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxHeatmapComponent> {
  const f = TestBed.createComponent(AxHeatmapComponent);
  f.componentRef.setInput('matrix', MATRIX);
  f.componentRef.setInput('ariaLabel', 'Activity');
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

const rects = (f: ComponentFixture<AxHeatmapComponent>) =>
  f.nativeElement.querySelectorAll('rect') as NodeListOf<SVGRectElement>;

describe('AxHeatmapComponent', () => {
  it('renders one rect per matrix cell with a value title', () => {
    const f = create();
    expect(rects(f).length).toBe(4);
    expect(f.nativeElement.querySelector('rect title')?.textContent).toBe('0');
  });

  it('sequential mode sets fill-opacity and a single base token', () => {
    const r = rects(create());
    expect(r[0].getAttribute('class')).toBe('fill-chart-1');
    expect(r[0].getAttribute('fill-opacity')).not.toBeNull();
  });

  it('bins mode maps cells to chart palette classes without fill-opacity', () => {
    const r = rects(create({ scale: 'bins' }));
    expect(r[1].getAttribute('class')).toMatch(/^fill-chart-[1-5]$/);
    expect(r[1].getAttribute('fill-opacity')).toBeNull();
  });

  it('exposes a role=img summary label', () => {
    const svg = create().nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Activity');
  });

  it('exposes a visually-hidden data table of the matrix values', () => {
    const table = create().nativeElement.querySelector('[data-heatmap-table]') as HTMLTableElement;
    expect(table).toBeTruthy();
    expect(table.className).toContain('sr-only');
    // MATRIX [[0,10],[5,3]] → 2 body rows, each with a row header + 2 values
    const rows = table.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    const firstRow = Array.from(rows[0].querySelectorAll('td')).map((c) => c.textContent?.trim());
    expect(firstRow).toEqual(['0', '10']);
  });

  it('generates a summary with the value range when no ariaLabel is given', () => {
    const svg = create({ ariaLabel: '' }).nativeElement.querySelector('svg') as SVGElement;
    // MATRIX [[0,10],[5,3]] → 2×2, values 0 to 10
    expect(svg.getAttribute('aria-label')).toBe('Heatmap, 2 rows by 2 columns, values 0 to 10');
  });

  it('floors sequential cell opacity at 0.3 so low-value cells stay visible', () => {
    const opacities = Array.from(rects(create())).map((r) => Number(r.getAttribute('fill-opacity')));
    expect(Math.min(...opacities)).toBeGreaterThanOrEqual(0.3);
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(create({ rows: ['A', 'B'], cols: ['x', 'y'] }).nativeElement)).toHaveNoViolations();
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
