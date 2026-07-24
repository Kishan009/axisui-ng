/**
 * Virtual-scroll integration tests (viewport + *axVirtualFor). jsdom reports
 * clientHeight 0, so the directive uses its 600px premeasure fallback — the
 * window is therefore deterministic (itemSize 40 -> 15 visible + overscan).
 * a11y asserted on the rendered window. Run twice (zoneless + Zone.js).
 */

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxVirtualForDirective } from './ax-virtual-for.directive';
import { AxVirtualViewportDirective } from './ax-virtual-viewport.directive';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxVirtualViewportDirective, AxVirtualForDirective],
  template: `
    <div axVirtualViewport class="h-80">
      <div *axVirtualFor="let row of rows(); itemSize: 40" class="vrow">{{ row }}</div>
    </div>
  `,
})
class HostComponent {
  rows = signal<string[]>(Array.from({ length: 1000 }, (_, i) => 'Row ' + i));
}

function setup() {
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  const viewport = fixture.debugElement
    .query(By.directive(AxVirtualViewportDirective))
    .injector.get(AxVirtualViewportDirective);
  return { fixture, host: fixture.componentInstance, viewport, el: viewport.element };
}

const rowTexts = (f: ComponentFixture<HostComponent>) =>
  Array.from(f.nativeElement.querySelectorAll('.vrow')).map((n) => (n as HTMLElement).textContent?.trim());
const spacerOf = (el: HTMLElement) => el.querySelector('[aria-hidden="true"]') as HTMLElement | null;

describe('virtual scroll', () => {
  it('renders only the window, not the whole list', () => {
    const { fixture } = setup();
    expect(rowTexts(fixture).length).toBe(20);
    expect(rowTexts(fixture)).toContain('Row 0');
    expect(rowTexts(fixture)).not.toContain('Row 500');
  });

  it('sizes a spacer to the full scroll height', () => {
    const { el } = setup();
    expect(spacerOf(el)?.style.height).toBe('40000px');
  });

  it('absolutely positions rows by index', () => {
    const { fixture } = setup();
    const first = fixture.nativeElement.querySelector('.vrow') as HTMLElement;
    expect(first.style.position).toBe('absolute');
    expect(first.style.top).toMatch(/^[0-9]+px$/);
  });

  it('shifts the window on scroll', () => {
    const { fixture, el } = setup();
    el.scrollTop = 4000;
    el.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    const texts = rowTexts(fixture);
    expect(texts).toContain('Row 100');
    expect(texts).not.toContain('Row 0');
    expect(texts.length).toBe(24);
  });

  it('scrollToIndex sets scrollTop from the registered itemSize', () => {
    const { viewport, el } = setup();
    viewport.scrollToIndex(50);
    expect(el.scrollTop).toBe(2000);
  });

  it('rebuilds when the data array changes', () => {
    const { fixture, host, el } = setup();
    host.rows.set(['only one']);
    fixture.detectChanges();
    expect(rowTexts(fixture)).toEqual(['only one']);
    expect(spacerOf(el)?.style.height).toBe('40px');
  });

  describe('a11y (3 modes)', () => {
    it('has no violations in LTR + light', async () => {
      expect(await axe(setup().fixture.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in RTL', async () => {
      const { fixture, el } = setup();
      el.setAttribute('dir', 'rtl');
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });
    it('has no violations in dark mode', async () => {
      const { fixture, el } = setup();
      el.classList.add('dark');
      expect(await axe(fixture.nativeElement)).toHaveNoViolations();
    });
  });
});
