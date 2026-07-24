/**
 * Unit + a11y (LTR / RTL / dark) tests for the Text primitive.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import {
  AxTextDirective,
  type AxTextAlign,
  type AxTextSize,
  type AxTextTone,
  type AxTextTracking,
  type AxTextTransform,
  type AxTextWeight,
} from './text.directive';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxTextDirective],
  template: `<p
    axText
    [size]="size"
    [weight]="weight"
    [tone]="tone"
    [tracking]="tracking"
    [transform]="transform"
    [align]="align"
    data-testid="t"
  >{{ label }}</p>`,
})
class TextHost {
  size: AxTextSize = 'sm';
  weight: AxTextWeight = 'normal';
  tone: AxTextTone = 'default';
  tracking: AxTextTracking = 'normal';
  transform: AxTextTransform = 'none';
  align: AxTextAlign | null = null;
  label = 'Body copy';
}

function create(overrides: Partial<TextHost> = {}) {
  const fixture = TestBed.createComponent(TextHost);
  Object.assign(fixture.componentInstance, overrides);
  fixture.detectChanges();
  return fixture;
}

const cls = (f: ReturnType<typeof create>) =>
  (f.nativeElement.querySelector('[data-testid="t"]') as HTMLElement).className;

describe('AxTextDirective', () => {
  describe('LTR + light', () => {
    it('applies the sm step by default', () => {
      expect(cls(create())).toContain('text-sm');
    });

    it('maps size, weight, tone, tracking, and transform to scale utilities', () => {
      const c = cls(create({ size: 'xl', weight: 'medium', tone: 'muted', tracking: 'wide', transform: 'upper' }));
      expect(c).toContain('text-xl');
      expect(c).toContain('font-medium');
      expect(c).toContain('text-muted-foreground');
      expect(c).toContain('tracking-wide');
      expect(c).toContain('uppercase');
    });

    it('uses logical alignment utilities only (never left/right)', () => {
      const c = cls(create({ align: 'end' }));
      expect(c).toContain('text-end');
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
