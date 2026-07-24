import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxStatRowComponent } from './stat-row.component';
import type { StatItem } from '../blocks.types';

expect.extend(toHaveNoViolations);

const STATS: StatItem[] = [
  { label: 'Users', value: 1200 },
  { label: 'Revenue', value: 5, prefix: '$', suffix: 'k', trend: 12 },
];

function create(inputs: Record<string, unknown> = {}): ComponentFixture<AxStatRowComponent> {
  const f = TestBed.createComponent(AxStatRowComponent);
  f.componentRef.setInput('stats', STATS);
  f.componentRef.setInput('ariaLabel', 'Key metrics');
  for (const [k, v] of Object.entries(inputs)) f.componentRef.setInput(k, v);
  f.detectChanges();
  return f;
}

describe('AxStatRowComponent', () => {
  it('renders one ax-statistic per stat', () => {
    expect(create().nativeElement.querySelectorAll('ax-statistic').length).toBe(2);
  });

  it('forwards the label and value', () => {
    expect(create().nativeElement.textContent).toContain('Users');
  });

  it('applies a fixed column class when columns is set', () => {
    const grid = create({ columns: 3 }).nativeElement.querySelector('.grid') as HTMLElement;
    expect(grid.className).toContain('grid-cols-3');
  });

  it('emphasizes the first stat cell as the primary metric', () => {
    const cells = create().nativeElement.querySelectorAll('.grid > div');
    expect(cells[0].className).toContain('bg-muted/40');
    expect(cells[1].className).not.toContain('bg-muted/40');
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
