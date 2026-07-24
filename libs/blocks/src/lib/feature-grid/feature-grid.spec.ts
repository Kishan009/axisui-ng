import { ComponentFixture, TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxFeatureGridComponent } from './feature-grid.component';
import type { FeatureItem } from '../blocks.types';

expect.extend(toHaveNoViolations);

const FEATURES: FeatureItem[] = [
  { icon: 'check', title: 'Fast', description: 'Signals-native and zoneless-ready.' },
  { icon: 'star', title: 'Themeable', description: 'OKLCH token system, preset-reactive.' },
];

function create(): ComponentFixture<AxFeatureGridComponent> {
  const f = TestBed.createComponent(AxFeatureGridComponent);
  f.componentRef.setInput('features', FEATURES);
  f.componentRef.setInput('ariaLabel', 'Features');
  f.detectChanges();
  return f;
}

describe('AxFeatureGridComponent', () => {
  it('renders each feature with its title and description', () => {
    const el = create().nativeElement as HTMLElement;
    expect(el.textContent).toContain('Fast');
    expect(el.textContent).toContain('Themeable');
    expect(el.textContent).toContain('Signals-native and zoneless-ready.');
  });

  it('emphasizes the first feature with a wider span and shows icons on even indices only', () => {
    const el = create().nativeElement as HTMLElement;
    const cells = el.querySelectorAll('.bg-card');
    expect(cells[0].className).toContain('sm:col-span-2');
    // Even indices (0) keep an icon; odd (1) are text-only.
    expect(el.querySelectorAll('ax-icon').length).toBe(1);
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
