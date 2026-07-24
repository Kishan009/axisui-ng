/**
 * Smoke tests for the icons lib. The full icon set is rendered
 * in apps/demo (deferred to end of Phase 1); here we just verify
 * the component pipeline and registry are wired correctly.
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { ICON_REGISTRY } from './registry';
import { AxIconComponent } from './ax-icon.component';
import { _resetUserRegistry, iconRegistrySize, registerIcon } from './user-registry';

expect.extend(toHaveNoViolations);

describe('@axisui-ng/icons', () => {
  beforeEach(() => _resetUserRegistry());

  it('ships 30 first-party icons', () => {
    expect(Object.keys(ICON_REGISTRY).length).toBeGreaterThanOrEqual(30);
  });

  it('ships the Phase 2 expanded icon set (55+)', () => {
    expect(Object.keys(ICON_REGISTRY).length).toBeGreaterThanOrEqual(55);
  });

  it('ships 150 first-party icons', () => {
    expect(Object.keys(ICON_REGISTRY).length).toBeGreaterThanOrEqual(150);
  });

  it('every icon has non-empty inner SVG content and no hardcoded fills', () => {
    for (const [, svg] of Object.entries(ICON_REGISTRY)) {
      expect(typeof svg).toBe('string');
      expect(svg.length).toBeGreaterThan(0);
      expect(svg.trimStart().startsWith('<')).toBe(true);
      expect(svg).not.toContain('fill='); // stroke + currentColor only
    }
  });

  it('user-registry is empty by default', () => {
    expect(iconRegistrySize()).toBe(0);
  });

  it('registerIcon adds to the user registry', () => {
    registerIcon('my-sparkle', () => Promise.resolve({}));
    expect(iconRegistrySize()).toBe(1);
  });
});

@Component({
  standalone: true,
  imports: [AxIconComponent],
  template: `<ax-icon name="check" [size]="size" [label]="label" />`,
})
class TestHostComponent {
  size: number | string = 16;
  label: string | null = null;
}

describe('AxIconComponent', () => {
  it('renders an SVG element with the requested icon name', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('ax-icon') as HTMLElement;
    expect(host.getAttribute('data-ax-icon')).toBe('check');
    const svg = host.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('renders the icon inner SVG content (the <path>) into the DOM', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    // The registry entry for `check` is a single <path>. If the
    // DomSanitizer strips SVG inner content, the <svg> wrapper still
    // renders but this query returns null — an empty-box icon.
    const path = fixture.nativeElement.querySelector('svg path') as SVGPathElement | null;
    expect(path).toBeTruthy();
    // Confirm it is the real check-icon content, not the fallback.
    expect(path?.getAttribute('d')).toBe('M20 6L9 17l-5-5');
  });

  it('applies the requested size to the SVG', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.size = 24;
    fixture.detectChanges();
    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
  });

  it('marks the host aria-hidden', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('ax-icon') as HTMLElement;
    expect(host.getAttribute('aria-hidden')).toBe('true');
  });

  it('becomes a meaningful role=img with an accessible name when [label] is set', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.label = 'Verified';
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('ax-icon') as HTMLElement;
    expect(host.getAttribute('role')).toBe('img');
    expect(host.getAttribute('aria-label')).toBe('Verified');
    expect(host.getAttribute('aria-hidden')).toBeNull();
  });

  it('has no a11y violations (decorative, aria-hidden)', async () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
