import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { axe, toHaveNoViolations } from 'jest-axe';

import { AxSpinnerComponent } from './spinner.component';

expect.extend(toHaveNoViolations);

@Component({
  standalone: true,
  imports: [AxSpinnerComponent],
  template: `<ax-spinner [size]="size" [ariaLabel]="label" />`,
})
class HostComponent {
  size: 'sm' | 'md' | 'lg' = 'md';
  label = 'Loading';
}

describe('AxSpinnerComponent', () => {
  it('renders with role="status" and an accessible label', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-label')).toBe('Loading');
  });

  it('has no a11y violations', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const results = await axe(fixture.nativeElement);
    expect(results).toHaveNoViolations();
  });
});
