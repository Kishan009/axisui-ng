/**
 * Unit + a11y (LTR / RTL / dark) tests for the Heading primitive.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import {
  AxHeadingDirective,
  type AxHeadingSize,
  type AxHeadingTracking,
  type AxHeadingWeight,
} from './heading.directive';
import type { AxTextAlign, AxTextTone } from '../text/text.directive';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxHeadingDirective],
  template: `<h1
    axHeading
    [size]="size"
    [weight]="weight"
    [tracking]="tracking"
    [tone]="tone"
    [balance]="balance"
    [align]="align"
    data-testid="h"
  >{{ label }}</h1>`,
})
class HeadingHost {
  size: AxHeadingSize = 'xl';
  weight: AxHeadingWeight = 'semibold';
  tracking: AxHeadingTracking = 'tight';
  tone: AxTextTone = 'default';
  balance = true;
  align: AxTextAlign | null = null;
  label = 'Account settings';
}

function create(overrides: Partial<HeadingHost> = {}) {
  const fixture = TestBed.createComponent(HeadingHost);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  return fixture;
}

const cls = (f: ReturnType<typeof create>) =>
  (f.nativeElement.querySelector('[data-testid="h"]') as HTMLElement).className;

describe('AxHeadingDirective', () => {
  describe('LTR + light', () => {
    it('defaults to xl / semibold / tight tracking / balanced wrapping', () => {
      const c = cls(create());
      expect(c).toContain('text-xl');
      expect(c).toContain('font-semibold');
      expect(c).toContain('tracking-tight');
      expect(c).toContain('text-balance');
    });

    it('maps size and tone to scale utilities', () => {
      const c = cls(create({ size: '3xl', tone: 'muted' }));
      expect(c).toContain('text-3xl');
      expect(c).toContain('text-muted-foreground');
    });

    it('drops text-balance when balance is false', () => {
      expect(cls(create({ balance: false }))).not.toContain('text-balance');
    });

    it('uses logical alignment utilities only (never left/right)', () => {
      const c = cls(create({ align: 'center' }));
      expect(c).toContain('text-center');
      expect(c).not.toMatch(/text-(left|right)/);
    });

    it('has no a11y violations', async () => {
      expect(await axe(create().nativeElement)).toHaveNoViolations();
    });
  });

  describe('RTL', () => {
    it('has no a11y violations', async () => {
      const f = create({ align: 'end' });
      f.nativeElement.setAttribute('dir', 'rtl');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });

  describe('Dark mode', () => {
    it('has no a11y violations', async () => {
      const f = create({ tone: 'muted' });
      f.nativeElement.classList.add('dark');
      expect(await axe(f.nativeElement)).toHaveNoViolations();
    });
  });
});
