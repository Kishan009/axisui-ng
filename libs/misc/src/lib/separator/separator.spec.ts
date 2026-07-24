import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSeparatorComponent } from './separator.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxSeparatorComponent],
  template: `
    <ax-separator />
    <ax-separator orientation="vertical" />
    <ax-separator [decorative]="false" />
    <ax-separator orientation="vertical" [decorative]="false" />
  `,
})
class HostComponent {}

describe('AxSeparator', () => {
  function render(): NodeListOf<HTMLElement> {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture.nativeElement.querySelectorAll('ax-separator');
  }

  it('is decorative by default (role="none", no aria-orientation)', () => {
    const [decorative] = render();
    expect(decorative.getAttribute('role')).toBe('none');
    expect(decorative.getAttribute('aria-orientation')).toBeNull();
  });

  it('exposes role="separator" + aria-orientation when semantic', () => {
    const seps = render();
    const semanticH = seps[2];
    const semanticV = seps[3];
    expect(semanticH.getAttribute('role')).toBe('separator');
    expect(semanticH.getAttribute('aria-orientation')).toBe('horizontal');
    expect(semanticV.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('applies orientation classes and data-orientation', () => {
    const seps = render();
    const horizontal = seps[0];
    const vertical = seps[1];
    expect(horizontal.getAttribute('data-orientation')).toBe('horizontal');
    expect(horizontal.className).toContain('block');
    expect(horizontal.className).toContain('w-full');
    expect(horizontal.className).toContain('h-px');
    expect(horizontal.className).toContain('bg-border');
    expect(vertical.getAttribute('data-orientation')).toBe('vertical');
    expect(vertical.className).toContain('h-full');
    expect(vertical.className).toContain('w-px');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
