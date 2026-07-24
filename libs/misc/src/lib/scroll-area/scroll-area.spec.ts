/**
 * AxScrollAreaComponent — unit + a11y tests. a11y is asserted in three modes
 * (LTR / RTL / dark) by toggling the rendered host element (not the global
 * document, per the SSR-safety convention). CI runs this suite twice
 * (zoneless + Zone.js).
 */

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxScrollAreaComponent, type ScrollAreaOrientation } from './scroll-area.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxScrollAreaComponent],
  template: `
    <ax-scroll-area class="h-40 w-40" [orientation]="orientation()" [ariaLabel]="ariaLabel()">
      <p>scrollable content</p>
    </ax-scroll-area>
  `,
})
class TestHostComponent {
  orientation = signal<ScrollAreaOrientation>('vertical');
  ariaLabel = signal<string | null>(null);
}

function setup() {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('ax-scroll-area') as HTMLElement;
  return { fixture, el };
}

describe('AxScrollAreaComponent', () => {
  it('renders and projects content', () => {
    const { el } = setup();
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('scrollable content');
  });

  it('is a focusable scrollport (tabindex=0)', () => {
    expect(setup().el.getAttribute('tabindex')).toBe('0');
  });

  it('defaults to vertical overflow', () => {
    const { el } = setup();
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.classList.contains('overflow-y-auto')).toBe(true);
  });

  it('switches overflow with orientation', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.orientation.set('horizontal');
    fixture.detectChanges();
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.classList.contains('overflow-x-auto')).toBe(true);

    fixture.componentInstance.orientation.set('both');
    fixture.detectChanges();
    expect(el.classList.contains('overflow-auto')).toBe(true);
  });

  it('applies cross-browser styled-scrollbar utilities', () => {
    const { el } = setup();
    expect(el.className).toContain('scrollbar-width:thin');
    expect(el.className).toContain('::-webkit-scrollbar');
  });

  it('exposes a labelled region only when ariaLabel is set', () => {
    const { fixture, el } = setup();
    expect(el.getAttribute('role')).toBeNull();

    fixture.componentInstance.ariaLabel.set('Files');
    fixture.detectChanges();
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('Files');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(setup().fixture.nativeElement)).toHaveNoViolations();
    });

    it('has no violations in RTL', async () => {
      const { fixture } = setup();
      (fixture.nativeElement as HTMLElement).setAttribute('dir', 'rtl');
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });

    it('has no violations in dark mode', async () => {
      const { fixture } = setup();
      (fixture.nativeElement as HTMLElement).classList.add('dark');
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });
  });
});
